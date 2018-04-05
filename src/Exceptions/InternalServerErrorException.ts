import { HttpException } from "./HttpException";

export class InternalServerErrorException extends HttpException {
    name: string = "Error.Kanro.Http.InternalServerError";

    constructor(message: string = "Internal Server Error", innerException?: Error) {
        super(500, message, innerException);
    }
}