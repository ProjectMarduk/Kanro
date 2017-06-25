import { IRequestReplicator } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IRequestHandlerContainer } from "./IRequestHandlerContainer";
import { IRequestDiverterContainer } from "./IRequestDiverterContainer";
import { IResponderContainer } from "./IResponderContainer";

export interface IRequestReplicatorContainer extends IExecutorContainer {
    type: "RequestReplicator";
    next: (IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer)[];
    instance?: IRequestReplicator;
}