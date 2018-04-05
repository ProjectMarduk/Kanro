import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
    name: string = "Error.Kanro.Http.NotFound";

    constructor(message: string = "Not Found", innerException?: Error) {
        super(404, message, innerException);
    }
}