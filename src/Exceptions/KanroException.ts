export class KanroException extends Error {
    public name: string = "Error.Kanro";
    public message: string;
    public innerException: Error;

    constructor(message: string, innerException: Error = undefined) {
        super(message);
        this.message = message;
        this.innerException = innerException;
    }
}