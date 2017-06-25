import { IRequest } from "../Http";
import { IFuseContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IFuse } from "./IFuse";
import { ExecutorType } from "./ExecutorType";

export class BaseFuse extends BaseExecutor implements IFuse {
    async fusing(err: Error, request: IRequest): Promise<IRequest> {
        return request;
    }

    type: ExecutorType.Fuse = ExecutorType.Fuse;
    name: string = "BaseExceptionHandler";

    constructor(config: IFuseContainer) {
        super(config);
    }
}