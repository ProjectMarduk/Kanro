import { IResponse } from "../Http";
import { IResponseHandlerContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IResponseHandler } from "./IResponseHandler";
import { ExecutorType } from "./ExecutorType";

export class BaseResponseHandler extends BaseExecutor implements IResponseHandler {
    async handler(response: IResponse): Promise<IResponse> {
        return response;
    }

    type: ExecutorType.ResponseHandler = ExecutorType.ResponseHandler;
    name: string = "BaseResponseHandler";

    constructor(config: IResponseHandlerContainer) {
        super(config);
    }
}