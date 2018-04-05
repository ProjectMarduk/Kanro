import { HttpException } from "./HttpException";

export class InsufficientStorageException extends HttpException {
    name: string = "Error.Kanro.Http.InsufficientStorage";

    constructor(message: string = "Insufficient Storage", innerException?: Error) {
        super(507, message, innerException);
    }
}