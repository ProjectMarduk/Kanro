import { HttpException } from "./HttpException";

export class BadGatewayException extends HttpException {
    name: string = "Error.Kanro.Http.BadGateway";

    constructor(message: string = "Bad Gateway", innerException?: Error) {
        super(502, message, innerException);
    }
}