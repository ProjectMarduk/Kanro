import { IRequestDiverter } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IRequestHandlerContainer } from "./IRequestHandlerContainer";
import { IRequestReplicatorContainer } from "./IRequestReplicatorContainer";
import { IResponderContainer } from "./IResponderContainer";

export interface IRequestDiverterContainer extends IExecutorContainer {
    type: "RequestDiverter";
    next: (IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer)[];
    instance?: IRequestDiverter;
}