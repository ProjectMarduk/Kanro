import { IRequestHandler } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IRequestDiverterContainer } from "./IRequestDiverterContainer";
import { IRequestReplicatorContainer } from "./IRequestReplicatorContainer";
import { IResponderContainer } from "./IResponderContainer";

export interface IRequestHandlerContainer extends IExecutorContainer {
    type: "RequestHandler";
    next: IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer;
    instance?: IRequestHandler;
}