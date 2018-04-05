import { HttpException } from "./HttpException";

export class NotImplementedException extends HttpException {
    name: string = "Error.Kanro.Http.NotImplemented";

    constructor(message: string = "Not Implemented", innerException?: Error) {
        super(501, message, innerException);
    }
}