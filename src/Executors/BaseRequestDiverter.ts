import { IRequest } from "../Http";
import { IRequestDiverterContainer, IExecutorContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IRequestDiverter } from "./IRequestDiverter";
import { ExecutorType } from "./ExecutorType";

export class BaseRequestDiverter extends BaseExecutor implements IRequestDiverter {
    index: number = 0;
    async shunt(request: IRequest, nodes: IExecutorContainer[]): Promise<IExecutorContainer> {
        let i = this.index % nodes.length;
        this.index++;
        if (this.index == nodes.length) {
            this.index = 0;
        }
        return nodes[i];
    }
    type: ExecutorType.RequestDiverter = ExecutorType.RequestDiverter;
    name: string = "BaseRequestDiverter";

    constructor(config: IRequestDiverterContainer) {
        super(config);
    }
}