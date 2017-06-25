import { HttpException } from "./HttpException";

export class GoneException extends HttpException {
    public name: string = "Error.Kanro.Http.Gone";

    constructor(message: string = "Gone", innerException: Error = undefined) {
        super(410, message, innerException);
    }
}