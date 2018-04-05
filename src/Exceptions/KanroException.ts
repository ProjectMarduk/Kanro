export class KanroException extends Error {
    name: string = "Error.Kanro";
    message: string;
    innerException: Error;

    constructor(message: string, innerException?: Error) {
        super(message);
        this.message = message;
        this.innerException = innerException;
    }
}