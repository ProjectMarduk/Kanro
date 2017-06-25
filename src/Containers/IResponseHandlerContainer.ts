import { IExecutorContainer } from "./IExecutorContainer";
import { IResponseHandler } from "../Executors/IResponseHandler";

export interface IResponseHandlerContainer extends IExecutorContainer {
    type: "ResponseHandler";
    next: IResponseHandlerContainer;
    instance?: IResponseHandler;
}