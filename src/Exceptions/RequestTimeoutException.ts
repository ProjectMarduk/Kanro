import { HttpException } from "./HttpException";

export class RequestTimeoutException extends HttpException {
    public name: string = "Error.Kanro.Http.RequestTimeout";

    constructor(message: string = "Request Timeout", innerException: Error = undefined) {
        super(408, message, innerException);
    }
}