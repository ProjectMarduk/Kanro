import { KanroException } from "./KanroException";

export class InvalidNodeException extends KanroException {
    public name: string = "Error.Kanro.Node.Invalid";
    public node = undefined;

    constructor(node: any, message: string = "Invalid Kanro node.", innerException: Error = undefined) {
        super(message, innerException);
        if (node == undefined) {
            this.message = "Kanro node not found";
        }
        this.node = node;
    }
}