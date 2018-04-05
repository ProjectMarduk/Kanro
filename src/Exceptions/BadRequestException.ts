import { HttpException } from "./HttpException";

export class BadRequestException extends HttpException {
    name: string = "Error.Kanro.Http.BadRequest";

    constructor(message: string = "Bad Request", innerException?: Error) {
        super(400, message, innerException);
    }
}