import { HttpException } from "./HttpException";

export class MethodNotAllowedException extends HttpException {
    public name: string = "Error.Kanro.Http.MethodNotAllowed";

    constructor(message: string = "Method Not Allowed", innerException: Error = undefined) {
        super(405, message, innerException);
    }
}