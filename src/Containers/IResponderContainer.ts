import { IResponder } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IResponseHandlerContainer } from "./IResponseHandlerContainer";

export interface IResponderContainer extends IExecutorContainer {
    type: "Responder";
    next: IResponseHandlerContainer;
    instance?: IResponder;
}