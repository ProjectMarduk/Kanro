import { IExecutorContainer } from "../Containers";
import { RouterKey } from "./RouterKey";

export class RouterResult {
    param: { [name: string]: string };
    executor: IExecutorContainer;
    deep: number;
    routerStack: RouterKey[];

    constructor(executor: IExecutorContainer, deep: number, routerStack: RouterKey[], param: { [name: string]: string } = {}) {
        this.executor = executor;
        this.deep = deep;
        this.routerStack = routerStack;
        this.param = param;
    }
}