import * as Cluster from "cluster";
import { Node, RequestDiverter, INodeContainer } from "../Core";
import { IRequest, Request } from "../Http";
import { NotFoundException } from "../Exceptions";
import { IModuleInfo, Service } from "../Core";
import { RouterResult } from "./RouterResult";
import { RouterNode } from "./RouterNode";
import { Logger, Colors, AnsiStyle, ILogger } from "../Logging";
import { KanroManager } from "..";
import { KanroModule } from "../KanroModule";

export class UrlRouter extends RequestDiverter {
    async shunt(request: IRequest, nodes: INodeContainer<Node>[]): Promise<INodeContainer<Node>> {
        let result: RouterResult[] = this.node.matchRequest(<any>request, (<Request>request).routerIndex);

        let deep: number = -1;
        let selectedNode: RouterResult = undefined;
        for (let node of result) {
            if (node.deep > deep) {
                deep = node.deep;
                selectedNode = node;
            } else if (node.deep === deep) {
                for (let index: number = 0; index < selectedNode.routerStack.length; index++) {
                    if (selectedNode.routerStack[index].type < node.routerStack[index].type) {
                        selectedNode = node;
                        break;
                    } else if (selectedNode.routerStack[index].type > node.routerStack[index].type) {
                        break;
                    }
                }
            }
        }

        if (selectedNode == null || selectedNode.node == null) {
            throw new NotFoundException();
        }

        (<Request>request).routerIndex = deep;
        request.param = Object.assign(request.param == null ? {} : request.param, selectedNode.param);
        return selectedNode.node;
    }
    node: RouterNode;
    $preRouters: string = "";
    dependencies = { kanroManager: { name: KanroManager.name, module: KanroModule.moduleInfo } };
    container: INodeContainer<RequestDiverter>;
    logger: ILogger;

    constructor(container: INodeContainer<RequestDiverter>) {
        super(container);
        // this.$preRouters = container["$preRouters"] != null ? container["$preRouters"] : "";
        this.container = container;
    }

    async onCreated(): Promise<void> {
        this.container.next = [];
        for (let name in this.container) {
            if (name.startsWith("/")) {
                this.container.next.push(this.container[name]);
            }
        }
    }

    async onLoaded(): Promise<void> {
        this.logger =
            await (await this.getDependedService<KanroManager>("kanroManager"))
                .registerLogger("Router", AnsiStyle.create().foreground(Colors.red));

        this.node = new RouterNode(undefined);
        for (let name in this.container) {
            if (name.startsWith("/")) {
                this.node.addRouter(this.container[name], name);
                if (name.endsWith("/**")) {
                    if (this.addRouterKeyToNextRouter(`${this.$preRouters}${name.slice(0, name.length - 3)}`, this.container[name])) {
                        continue;
                    }
                }

                if (Cluster.isMaster) {
                    this.logger.success(`Router node '${this.$preRouters}${name}' added.`);
                }
            }
        }
    }

    addRouterKeyToNextRouter(key: string, node: INodeContainer<Node>[] | INodeContainer<Node>): boolean {
        let result: boolean = false;

        if (node == null) {
            return;
        }

        if (key.endsWith("/")) {
            key = key.slice(0, key.length - 1);
        }
        if (Array.isArray(node)) {
            for (let e of node) {
                result = result || this.addRouterKeyToNextRouter(key, e);
            }
            return result;
        }

        if (node.name === this.name) {
            let router: INodeContainer<UrlRouter> = <INodeContainer<UrlRouter>>node;
            if (router.instance.$preRouters == null) {
                router.instance.$preRouters = "";
            }
            router.instance.$preRouters += key;

            for (let routerKey in router) {
                if (routerKey.startsWith("/")) {
                    this.addRouterKeyToNextRouter(key, router[routerKey]);
                }
            }

            result = true;
        }

        return result || this.addRouterKeyToNextRouter(key, node.next);
    }
}