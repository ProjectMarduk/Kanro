import { HttpException } from "./HttpException";

export class MethodNotAllowedException extends HttpException {
    name: string = "Error.Kanro.Http.MethodNotAllowed";

    constructor(message: string = "Method Not Allowed", innerException?: Error) {
        super(405, message, innerException);
    }
}