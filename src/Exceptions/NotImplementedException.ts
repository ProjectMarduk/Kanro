import { HttpException } from "./HttpException";

export class NotImplementedException extends HttpException {
    public name: string = "Error.Kanro.Http.NotImplemented";

    constructor(message: string = "Not Implemented", innerException: Error = undefined) {
        super(501, message, innerException);
    }
}