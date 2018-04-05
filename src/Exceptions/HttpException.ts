import { KanroException } from "./KanroException";

export class HttpException extends KanroException {
    name: string = "Error.Kanro.Http";
    status: number = undefined;

    constructor(status: number, message: string, innerException?: Error) {
        super(message, innerException);
        this.status = status;
    }
}