import { KanroException } from "./KanroException";

export class InvalidExecutorException extends KanroException {
    public name: string = "Error.Kanro.Executor.Invalid";
    public executor = undefined;

    constructor(executor: any, message: string = "Invalid Kanro executor.", innerException: Error = undefined) {
        super(message, innerException);
        if (executor == undefined) {
            this.message = "Kanro executor not found";
        }
        this.executor = executor;
    }
}