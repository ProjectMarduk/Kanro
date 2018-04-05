import { HttpException } from "./HttpException";

export class ConflictException extends HttpException {
    name: string = "Error.Kanro.Http.Conflict";

    constructor(message: string = "Conflict", innerException?: Error) {
        super(409, message, innerException);
    }
}