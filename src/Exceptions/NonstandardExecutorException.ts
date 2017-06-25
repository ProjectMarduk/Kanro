import { KanroException } from "./KanroException";
import { IExecutorContainer } from "../Containers";

export class NonstandardExecutorException extends KanroException {
    name: string = "Error.Kanro.Executor.Nonstandard";
    executor: IExecutorContainer;

    constructor(executor: IExecutorContainer, message: string = undefined, innerException: Error = undefined) {
        super(message, innerException);
        this.executor = executor;

        if (message == undefined) {
            message = `Nonstandard output has been given by '${this.executor.module.name}@${this.executor.module.version}:${this.executor.name}'.`;
        }
    }
}