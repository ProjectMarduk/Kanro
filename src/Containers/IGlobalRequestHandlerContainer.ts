import { IGlobalRequestHandler } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";

export interface IGlobalRequestHandlerContainer extends IExecutorContainer {
    type: "GlobalRequestHandler";
    next: IGlobalRequestHandlerContainer;
    instance?: IGlobalRequestHandler;
}