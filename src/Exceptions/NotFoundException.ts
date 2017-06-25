import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
    public name: string = "Error.Kanro.Http.NotFound";

    constructor(message: string = "Not Found", innerException: Error = undefined) {
        super(404, message, innerException);
    }
}