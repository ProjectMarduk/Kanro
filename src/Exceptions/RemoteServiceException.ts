import { KanroException } from "./KanroException";

export class RemoteServiceException extends KanroException {
    public name: string = "Error.Kanro.RemoteService";

    constructor(operation: string, innerException: Error = undefined) {
        super(`Local only operation(${operation}) for remote service.`, innerException);
    }
}