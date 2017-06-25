import { HttpException } from "./HttpException";

export class ConflictException extends HttpException {
    public name: string = "Error.Kanro.Http.Conflict";

    constructor(message: string = "Conflict", innerException: Error = undefined) {
        super(409, message, innerException);
    }
}