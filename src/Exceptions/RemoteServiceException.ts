import { KanroException } from "./KanroException";

export class RemoteServiceException extends KanroException {
    name: string = "Error.Kanro.RemoteService";

    constructor(operation: string, innerException?: Error) {
        super(`Local only operation(${operation}) for remote service.`, innerException);
    }
}