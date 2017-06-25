import { IExceptionHandler } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IResponseHandlerContainer } from "./IResponseHandlerContainer";

export interface IExceptionHandlerContainer extends IExecutorContainer {
    type: "ExceptionHandler";
    next: IResponseHandlerContainer;
    instance?: IExceptionHandler;
}