import {
    ExceptionHandler,
    Fuse,
    INodeContainer,
    Node,
    RequestDiverter,
    RequestHandler,
    RequestReplicator,
    Responder,
    ResponseHandler
} from "./Core/index";
import { IRequest, RequestContext } from "./Http";
import { NonstandardNodeException } from "./Exceptions/index";
import { UnexpectedNodeException } from "./Exceptions/UnexpectedNodeException";

export async function NodeHandler(context: RequestContext, container: INodeContainer<Node>): Promise<RequestContext> {
    if (container == null) {
        return context;
    }

    context.traceStack.push(container);

    try {
        let next: INodeContainer<Node>;

        if (container.instance instanceof RequestHandler) {
            context.request = <any>await container.instance.handler(context.request);
            next = <INodeContainer<Node>>container.next;
        } else if (container.instance instanceof RequestDiverter) {
            next = await container.instance.shunt(context.request, <INodeContainer<Node>[]>container.next);
        } else if (container.instance instanceof RequestReplicator) {
            let nextNodeContainers: INodeContainer<Node>[] = <INodeContainer<Node>[]>container.next;

            let nodes: Node[] = nextNodeContainers.map((c) => c.instance);
            if (nextNodeContainers.length === 0) {
                throw new UnexpectedNodeException(container);
            }

            let requests: IRequest[] = await container.instance.copy(context.request, nextNodeContainers.length);

            if (nextNodeContainers.length !== requests.length) {
                throw new NonstandardNodeException(container);
            }

            requests.forEach((v, i, a) => {
                if (i === 0) {
                    context.request = <any>v;
                } else {
                    NodeHandler(context.fork(<any>v, undefined), nextNodeContainers[i]);
                }
            });

            next = nextNodeContainers[0];
        } else if (container.instance instanceof Responder) {
            context.response = <any>await container.instance.respond(context.request);
            next = <INodeContainer<Node>>container.next;
        } else if (container.instance instanceof ResponseHandler) {
            context.response = await container.instance.handler(context.response);
            next = <INodeContainer<Node>>container.next;
        } else if (container.instance instanceof ExceptionHandler) {
            let res: any = <any>await container.instance.handler(context.error, context.request, context.response);
            if (res == null) {
                return null;
            }
            context.response = res;
            next = <INodeContainer<Node>>container.next;
        } else if (container.instance instanceof Fuse) {
            let req: any = <any>await container.instance.fusing(context.error, context.request);
            if (req == null) {
                return null;
            }
            context.request = req;
            next = <INodeContainer<Node>>container.next;
        }

        return await NodeHandler(context, next);
    } catch (error) {
        context.error = error;

        if (container.fuses != null) {
            for (let fuse of container.fuses) {
                try {
                    let result: RequestContext = await NodeHandler(context, fuse);
                    if (result != null) {
                        return result;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        if (container.exceptionHandlers != null) {
            for (let exceptionHandler of container.exceptionHandlers) {
                try {
                    let result: RequestContext = await NodeHandler(context, exceptionHandler);
                    if (result != null) {
                        return result;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        throw error;
    }
}