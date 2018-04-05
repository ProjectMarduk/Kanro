import { HttpException } from "./HttpException";

export class NotAcceptableException extends HttpException {
    name: string = "Error.Kanro.Http.NotAcceptable";

    constructor(message: string = "Not Acceptable", innerException?: Error) {
        super(406, message, innerException);
    }
}