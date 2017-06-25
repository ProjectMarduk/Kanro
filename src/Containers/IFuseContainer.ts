import { IFuse } from "../Executors";
import { IExecutorContainer } from "./IExecutorContainer";
import { IRequestHandlerContainer } from "./IRequestHandlerContainer";
import { IRequestDiverterContainer } from "./IRequestDiverterContainer";
import { IRequestReplicatorContainer } from "./IRequestReplicatorContainer";
import { IResponderContainer } from "./IResponderContainer";

export interface IFuseContainer extends IExecutorContainer {
    type: "Fuse";
    next: IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer;
    instance?: IFuse;
}