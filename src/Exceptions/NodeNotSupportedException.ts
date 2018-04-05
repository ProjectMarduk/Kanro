import { KanroException } from "./KanroException";
import { INodeContainer, Node } from "../Core";

export class NodeNotSupportedException extends KanroException {
    name: string = "Error.Kanro.Node.NotSupported";
    node: INodeContainer<Node>;

    constructor(node: INodeContainer<Node>, message: string = undefined, innerException?: Error) {
        super(message, innerException);
        this.node = node;
        if (message == null) {
            this.message = `Type of '${node.module.name}@${node.module.version}:${node.name}' is not supported.`;
        }
    }
}