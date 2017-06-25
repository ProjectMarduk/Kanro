import { IGlobalExceptionHandler } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IResponseHandlerContainer } from "./IResponseHandlerContainer";

export interface IGlobalExceptionHandlerContainer extends IExecutorContainer {
    type: "GlobalExceptionHandler";
    next: IResponseHandlerContainer;
    instance?: IGlobalExceptionHandler;
}