import { HttpException } from "./HttpException";

export class ProxyAuthenticationRequiredException extends HttpException {
    name: string = "Error.Kanro.Http.ProxyAuthenticationRequired";

    constructor(message: string = "Proxy Authentication Required", innerException?: Error) {
        super(407, message, innerException);
    }
}