import { KanroException } from "./KanroException";

export class ArgumentException extends KanroException {
    name: string = "Error.Kanro.Argument";
    paramName: string;

    constructor(message: string, paramName: string, innerException: Error = undefined) {
        super(message, innerException);
        paramName = paramName;
    }
}