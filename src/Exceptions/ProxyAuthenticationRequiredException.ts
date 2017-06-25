import { HttpException } from "./HttpException";

export class ProxyAuthenticationRequiredException extends HttpException {
    public name: string = "Error.Kanro.Http.ProxyAuthenticationRequired";

    constructor(message: string = "Proxy Authentication Required", innerException: Error = undefined) {
        super(407, message, innerException);
    }
}