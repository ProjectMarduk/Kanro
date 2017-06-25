import { HttpException } from "./HttpException";

export class NotAcceptableException extends HttpException {
    public name: string = "Error.Kanro.Http.NotAcceptable";

    constructor(message: string = "Not Acceptable", innerException: Error = undefined) {
        super(406, message, innerException);
    }
}