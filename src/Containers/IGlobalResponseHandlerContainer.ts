import { IGlobalResponseHandler } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";

export interface IGlobalResponseHandlerContainer extends IExecutorContainer {
    type: "GlobalResponseHandler";
    next: IGlobalResponseHandlerContainer;
    instance?: IGlobalResponseHandler;
}