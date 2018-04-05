import { HttpException } from "./HttpException";

export class GatewayTimeoutException extends HttpException {
    name: string = "Error.Kanro.Http.GatewayTimeout";

    constructor(message: string = "Gateway Timeout", innerException?: Error) {
        super(504, message, innerException);
    }
}