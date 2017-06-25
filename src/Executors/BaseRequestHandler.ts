import { IRequest } from "../Http";
import { IRequestHandlerContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IRequestHandler } from "./IRequestHandler";
import { ExecutorType } from "./ExecutorType";

export class BaseRequestHandler extends BaseExecutor implements IRequestHandler {

    async handler(request: IRequest): Promise<IRequest> {
        return request;
    }
    type: ExecutorType.RequestHandler = ExecutorType.RequestHandler;
    name: string = "BaseRequestHandler";

    constructor(config: IRequestHandlerContainer) {
        super(config);
    }
}