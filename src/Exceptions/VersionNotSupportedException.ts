import { HttpException } from "./HttpException";

export class VersionNotSupportedException extends HttpException {
    public name: string = "Error.Kanro.Http.VersionNotSupported";

    constructor(message: string = "HTTP Version Not Supported", innerException: Error = undefined) {
        super(505, message, innerException);
    }
}