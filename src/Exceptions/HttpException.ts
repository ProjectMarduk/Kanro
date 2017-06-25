import { KanroException } from "./KanroException";

export class HttpException extends KanroException {
    public name: string = "Error.Kanro.Http";
    public status: number = undefined;

    constructor(status: number, message: string, innerException: Error = undefined) {
        super(message, innerException);
        this.status = status;
    }
}