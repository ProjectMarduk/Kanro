import { HttpException } from "./HttpException";

export class ForbiddenException extends HttpException {
    name: string = "Error.Kanro.Http.Forbidden";

    constructor(message: string = "Forbidden", innerException?: Error) {
        super(403, message, innerException);
    }
}