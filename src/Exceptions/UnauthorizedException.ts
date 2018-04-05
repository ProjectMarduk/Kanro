import { HttpException } from "./HttpException";

export class UnauthorizedException extends HttpException {
    name: string = "Error.Kanro.Http.Unauthorized";

    constructor(message: string = "Unauthorized", innerException?: Error) {
        super(401, message, innerException);
    }
}