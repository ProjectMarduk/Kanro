import { HttpException } from "./HttpException";

export class InsufficientStorageException extends HttpException {
    public name: string = "Error.Kanro.Http.InsufficientStorage";

    constructor(message: string = "Insufficient Storage", innerException: Error = undefined) {
        super(507, message, innerException);
    }
}