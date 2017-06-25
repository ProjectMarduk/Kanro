import { HttpException } from "./HttpException";

export class InternalServerErrorException extends HttpException {
    public name: string = "Error.Kanro.Http.InternalServerError";

    constructor(message: string = "Internal Server Error", innerException: Error = undefined) {
        super(500, message, innerException);
    }
}