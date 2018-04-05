import { KanroException } from "./KanroException";
import { INodeContainer, Node } from "../Core";

export class NonstandardNodeException extends KanroException {
    name: string = "Error.Kanro.Node.Nonstandard";
    node: INodeContainer<Node>;

    constructor(node: INodeContainer<Node>, message: string = undefined, innerException?: Error) {
        super(message, innerException);
        this.node = node;
        if (message == null) {
            message = `Nonstandard output has been given by '${this.node.module.name}@${this.node.module.version}:${this.node.name}'.`;
        }
    }
}