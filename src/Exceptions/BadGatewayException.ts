import { HttpException } from "./HttpException";


export class BadGatewayException extends HttpException {
    public name: string = "Error.Kanro.Http.BadGateway";

    constructor(message: string = "Bad Gateway", innerException: Error = undefined) {
        super(502, message, innerException);
    }
}