import { INodeContainer } from "../Core";
import { RouterKey } from "./RouterKey";
import { Router } from "./Router";

export class RouterResult {
    param: { [name: string]: string };
    node: INodeContainer<Router>;
    deep: number;
    routerStack: RouterKey[];

    constructor(node: INodeContainer<Router>, deep: number, routerStack: RouterKey[], param: { [name: string]: string } = {}) {
        this.node = node;
        this.deep = deep;
        this.routerStack = routerStack;
        this.param = param;
    }
}