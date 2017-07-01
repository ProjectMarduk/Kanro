import { KanroException } from "./KanroException";
import { INodeContainer, Node } from "../Core";

export class NodeNotSupportedException extends KanroException {
    public name: string = "Error.Kanro.Node.NotSupported";
    public node: INodeContainer<Node>;

    constructor(node: INodeContainer<Node>, message: string = undefined, innerException: Error = undefined) {
        super(message, innerException);
        this.node = node;
        if (message == undefined) {
            this.message = `Type of '${node.module.name}@${node.module.version}:${node.name}' is not supported.`;
        }
    }
}