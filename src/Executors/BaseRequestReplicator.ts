import { IRequest } from "../Http";
import { IRequestReplicatorContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IRequestReplicator } from "./IRequestReplicator";
import { ExecutorType } from "./ExecutorType";

export class BaseRequestReplicator extends BaseExecutor implements IRequestReplicator {
    async copy(request: IRequest, count: number): Promise<IRequest[]> {
        let result: IRequest[] = [];
        result.push(request);

        for (var index = 0; index < count; index++) {
            result.push(request.fork());
        }

        return result;
    }
    type: ExecutorType.RequestReplicator = ExecutorType.RequestReplicator;
    name: string = "BaseRequestReplicator";

    constructor(config: IRequestReplicatorContainer) {
        super(config);
    }
}