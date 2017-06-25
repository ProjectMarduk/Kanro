import { IResponse } from "../Http";
import { IGlobalResponseHandlerContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IGlobalResponseHandler } from "./IGlobalResponseHandler";
import { ExecutorType } from "./ExecutorType";

export class BaseGlobalResponseHandler extends BaseExecutor implements IGlobalResponseHandler {
    async handler(response: IResponse): Promise<IResponse> {
        return response;
    }

    type: ExecutorType.GlobalResponseHandler = ExecutorType.GlobalResponseHandler;
    name: string = "BaseGlobalResponseHandler";

    constructor(config: IGlobalResponseHandlerContainer) {
        super(config);
    }
}