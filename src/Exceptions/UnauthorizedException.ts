import { HttpException } from "./HttpException";

export class UnauthorizedException extends HttpException {
    public name: string = "Error.Kanro.Http.Unauthorized";

    constructor(message: string = "Unauthorized", innerException: Error = undefined) {
        super(401, message, innerException);
    }
}