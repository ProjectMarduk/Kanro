import { Node, RequestDiverter, Service, INodeContainer } from "../Core";
import { IRequest } from "../Http";
import { MethodNotAllowedException } from "../Exceptions";

export class MethodRouter extends RequestDiverter {
    async shunt(request: IRequest, nodes: INodeContainer<Node>[]): Promise<INodeContainer<Node>> {
        let method: string = request.method.toUpperCase();

        if (this.methods[method] != null) {
            return this.methods[method];
        }

        throw new MethodNotAllowedException();
    }

    methods: { [method: string]: INodeContainer<Node> } = {};

    constructor(container: INodeContainer<RequestDiverter>) {
        super(container);

        container.next = [];

        for (let key in container) {
            if (container.hasOwnProperty(key)) {
                switch (key.toUpperCase()) {
                    case "OPTIONS":
                    case "GET":
                    case "HEAD":
                    case "POST":
                    case "PUT":
                    case "DELETE":
                    case "TRACE":
                    case "CONNECT":
                    case "PATCH":
                        this.methods[key.toUpperCase()] = container[key];
                        container.next.push(container[key]);
                        break;
                    default:
                        if (key.startsWith("-")) {
                            this.methods[key.slice(1).toUpperCase()] = container[key];
                            container.next.push(container[key]);
                        }
                        break;
                }
            }
        }
    }
}