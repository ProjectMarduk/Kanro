import { HttpException } from "./HttpException";

export class RequestTimeoutException extends HttpException {
    name: string = "Error.Kanro.Http.RequestTimeout";

    constructor(message: string = "Request Timeout", innerException?: Error) {
        super(408, message, innerException);
    }
}