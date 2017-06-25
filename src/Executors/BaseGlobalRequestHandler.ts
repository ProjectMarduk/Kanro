import { IRequest, IResponse, JsonResponseBody } from "../Http";
import { IGlobalRequestHandlerContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IGlobalRequestHandler } from "./IGlobalRequestHandler";
import { ExecutorType } from "./ExecutorType";

export class BaseGlobalRequestHandler extends BaseExecutor implements IGlobalRequestHandler {
    async handler(request: IRequest): Promise<IRequest> {
        return request;
    }
    type: ExecutorType.GlobalRequestHandler = ExecutorType.GlobalRequestHandler;
    name: string = "BaseGlobalRequestHandler";

    constructor(config: IGlobalRequestHandlerContainer) {
        super(config);
    }
}