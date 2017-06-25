import { HttpException } from "./HttpException";

export class ServiceUnavailableException extends HttpException {
    public name: string = "Error.Kanro.Http.ServiceUnavailable";

    constructor(message: string = "Service Unavailable", innerException: Error = undefined) {
        super(503, message, innerException);
    }
}