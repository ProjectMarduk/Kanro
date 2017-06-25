import { HttpException } from "./HttpException";

export class MethodNotAllowedException extends HttpException {
    public name: string = "Error.Kanro.Http.MethodNotAllowed";

    constructor(message: string = "Bad Request", innerException: Error = undefined) {
        super(405, message, innerException);
    }
}