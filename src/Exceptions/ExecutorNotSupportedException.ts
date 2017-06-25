import { KanroException } from "./KanroException";
import { IExecutorContainer } from "../Containers";

export class ExecutorNotSupportedException extends KanroException {
    public name: string = "Error.Kanro.Executor.NotSupported";
    public executor: IExecutorContainer;

    constructor(executor: IExecutorContainer, message: string = undefined, innerException: Error = undefined) {
        super(message, innerException);
        this.executor = executor;
        if (message == undefined) {
            this.message = `Type of '${executor.module.name}@${executor.module.version}:${executor.name}' is not supported.`;
        }
    }
}