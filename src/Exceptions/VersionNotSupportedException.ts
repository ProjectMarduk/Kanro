import { HttpException } from "./HttpException";

export class VersionNotSupportedException extends HttpException {
    name: string = "Error.Kanro.Http.VersionNotSupported";

    constructor(message: string = "HTTP Version Not Supported", innerException?: Error) {
        super(505, message, innerException);
    }
}