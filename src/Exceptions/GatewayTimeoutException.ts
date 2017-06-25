import { HttpException } from "./HttpException";

export class GatewayTimeoutException extends HttpException {
    public name: string = "Error.Kanro.Http.GatewayTimeout";

    constructor(message: string = "Gateway Timeout", innerException: Error = undefined) {
        super(504, message, innerException);
    }
}