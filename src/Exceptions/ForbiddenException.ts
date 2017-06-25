import { HttpException } from "./HttpException";

export class ForbiddenException extends HttpException {
    public name: string = "Error.Kanro.Http.Forbidden";

    constructor(message: string = "Forbidden", innerException: Error = undefined) {
        super(403, message, innerException);
    }
}