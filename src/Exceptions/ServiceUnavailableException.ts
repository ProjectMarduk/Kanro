import { HttpException } from "./HttpException";

export class ServiceUnavailableException extends HttpException {
    name: string = "Error.Kanro.Http.ServiceUnavailable";

    constructor(message: string = "Service Unavailable", innerException?: Error) {
        super(503, message, innerException);
    }
}