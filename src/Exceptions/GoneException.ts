import { HttpException } from "./HttpException";

export class GoneException extends HttpException {
    name: string = "Error.Kanro.Http.Gone";

    constructor(message: string = "Gone", innerException?: Error) {
        super(410, message, innerException);
    }
}