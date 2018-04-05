import { INodeContainer } from "../Core";
import { RouterKey } from "./RouterKey";
import { UrlRouter } from "./UrlRouter";

export class RouterResult {
    param: { [name: string]: string };
    node: INodeContainer<UrlRouter>;
    deep: number;
    routerStack: RouterKey[];

    constructor(node: INodeContainer<UrlRouter>, deep: number, routerStack: RouterKey[], param: { [name: string]: string } = {}) {
        this.node = node;
        this.deep = deep;
        this.routerStack = routerStack;
        this.param = param;
    }
}