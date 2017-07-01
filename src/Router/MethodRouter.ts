import { Node, RequestDiverter, Service, INodeContainer } from "../Core";
import { IRequest } from "../Http";
import { MethodNotAllowedException } from "../Exceptions";

export class MethodRouter extends RequestDiverter {
    async shunt(request: IRequest, nodes: INodeContainer<Node>[]): Promise<INodeContainer<Node>> {
        let method = request.method.toUpperCase();

        if (this.methods[method] != undefined) {
            return this.methods[method];
        }

        throw new MethodNotAllowedException();
    }

    dependencies: { [name: string]: Service; } = {};
    methods: { [method: string]: INodeContainer<Node> } = {};

    constructor(container: INodeContainer<RequestDiverter>) {
        super(container);

        container.next = [];

        for (var key in container) {
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