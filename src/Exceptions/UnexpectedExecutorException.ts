import { KanroException } from "./KanroException";
import { IExecutorContainer } from "../Containers";

export class UnexpectedExecutorException extends KanroException {
    name: string = "Error.Kanro.Executor.Unexpected";
    executor: IExecutorContainer;

    constructor(executor: IExecutorContainer, message: string = "Unexpected input or output executor be provided.", innerException: Error = undefined) {
        super(message, innerException);
        this.executor = executor;
    }
}