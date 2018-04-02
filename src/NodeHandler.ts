import { INodeContainer, Node, RequestHandler, RequestDiverter, RequestReplicator, Responder, ResponseHandler, ExceptionHandler, Fuse } from "./Core/index";
import { UnexpectedNodeException } from "./Exceptions/UnexpectedNodeException";
import { NonstandardNodeException } from "./Exceptions/index";
import { RequestContext } from "./Http";

export async function NodeHandler(context: RequestContext, container: INodeContainer<Node>): Promise<RequestContext> {
    if (container == undefined) {
        return context;
    }

    context.traceStack.push(container);

    try {
        let next: INodeContainer<Node>;

        if (container.instance instanceof RequestHandler) {
            context.request = <any>await container.instance.handler(context.request);
            next = <INodeContainer<Node>>container.next;
        }
        else if (container.instance instanceof RequestDiverter) {
            next = await container.instance.shunt(context.request, <INodeContainer<Node>[]>container.next);
        }
        else if (container.instance instanceof RequestReplicator) {
            let nextNodeContainers = <INodeContainer<Node>[]>container.next;

            let nodes = nextNodeContainers.map((c) => c.instance);
            if (nextNodeContainers.length == 0) {
                throw new UnexpectedNodeException(container);
            }

            let requests = await container.instance.copy(context.request, nextNodeContainers.length);

            if (nextNodeContainers.length != requests.length) {
                throw new NonstandardNodeException(container);
            }

            requests.forEach((v, i, a) => {
                if (i == 0) {
                    context.request = <any>v;
                }
                else {
                    NodeHandler(context.fork(<any>v, undefined), nextNodeContainers[i]);
                }
            });

            next = nextNodeContainers[0];
        }
        else if (container.instance instanceof Responder) {
            context.response = <any>await container.instance.respond(context.request);
            next = <INodeContainer<Node>>container.next;
        }
        else if (container.instance instanceof ResponseHandler) {
            context.response = await container.instance.handler(context.response);
            next = <INodeContainer<Node>>container.next;
        }
        else if (container.instance instanceof ExceptionHandler) {
            let res = <any>await container.instance.handler(context.error, context.request, context.response);
            if (res == undefined) {
                return undefined;
            }
            context.response = res;
            next = <INodeContainer<Node>>container.next;
        }
        else if (container.instance instanceof Fuse) {
            let req = <any>await container.instance.fusing(context.error, context.request);
            if (req == undefined) {
                return undefined;
            }
            context.request = req;
            next = <INodeContainer<Node>>container.next;
        }

        return await NodeHandler(context, next);
    } catch (error) {
        context.error = error;

        if (container.fuses != undefined) {
            for (let fuse of container.fuses) {
                try {
                    let result = await NodeHandler(context, fuse);
                    if (result != undefined) {
                        return result;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        if (container.exceptionHandlers != undefined) {
            for (let exceptionHandler of container.exceptionHandlers) {
                try {
                    let result = await NodeHandler(context, exceptionHandler);
                    if (result != undefined) {
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