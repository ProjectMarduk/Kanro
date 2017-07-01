import { KanroException } from "./KanroException";
import { INodeContainer, Node } from "../Core";

export class UnexpectedNodeException extends KanroException {
    name: string = "Error.Kanro.Node.Unexpected";
    node: INodeContainer<Node>;

    constructor(node: INodeContainer<Node>, message: string = "Unexpected input or output node be provided.", innerException: Error = undefined) {
        super(message, innerException);
        this.node = node;
    }
}