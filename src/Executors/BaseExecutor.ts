import { IRequest, IResponse, JsonResponseBody } from "../Http";
import { IModuleInfo } from "../Core";
import { IExecutorContainer } from "../Containers";
import { IExecutor } from "./IExecutor";
import { IService } from "./IService";
import { ExecutorType } from "./ExecutorType";

export class BaseExecutor implements IExecutor {
    dependencies: { [name: string]: IService | IModuleInfo; };
    type: ExecutorType;
    name: string;

    constructor(config: IExecutorContainer) {
        this.dependencies = {};
    }
}