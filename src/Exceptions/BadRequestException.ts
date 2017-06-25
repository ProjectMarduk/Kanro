import { HttpException } from "./HttpException";

export class BadRequestException extends HttpException {
    public name: string = "Error.Kanro.Http.BadRequest";

    constructor(message: string = "Bad Request", innerException: Error = undefined) {
        super(400, message, innerException);
    }
}