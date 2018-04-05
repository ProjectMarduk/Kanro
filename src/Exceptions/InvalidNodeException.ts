import { KanroException } from "./KanroException";

export class InvalidNodeException extends KanroException {
    name: string = "Error.Kanro.Node.Invalid";
    node = undefined;

    constructor(node: any, message: string = "Invalid Kanro node.", innerException?: Error) {
        super(message, innerException);
        if (node == null) {
            this.message = "Kanro node not found";
        }
        this.node = node;
    }
}