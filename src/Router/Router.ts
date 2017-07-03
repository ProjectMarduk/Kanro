import * as Cluster from "cluster";
import { Node, RequestDiverter, INodeContainer } from "../Core";
import { IRequest, Request } from "../Http";
import { NotFoundException } from "../Exceptions";
import { IModuleInfo, Service } from "../Core";
import { RouterResult } from "./RouterResult";
import { RouterNode } from "./RouterNode";
import { Logger, Colors, AnsiStyle, ILogger } from "../Logging";
import { KanroManager } from "..";

export class Router extends RequestDiverter {
    async shunt(request: IRequest, nodes: INodeContainer<Node>[]): Promise<INodeContainer<Node>> {
        let result = this.node.matchRequest(<any>request, (<Request>request).routerIndex);

        let deep = -1;
        let selectedNode: RouterResult = undefined;
        for (let node of result) {
            if (node.deep > deep) {
                deep = node.deep;
                selectedNode = node;
            } else if (node.deep == deep) {
                for (var index = 0; index < selectedNode.routerStack.length; index++) {
                    if (selectedNode.routerStack[index].type < node.routerStack[index].type) {
                        selectedNode = node;
                        break;
                    } else if (selectedNode.routerStack[index].type > node.routerStack[index].type) {
                        break;
                    }
                }
            }
        }

        if (selectedNode == undefined || selectedNode.node == undefined) {
            throw new NotFoundException();
        }

        (<Request>request).routerIndex = deep;
        request["param"] = Object.assign(request["param"] == undefined ? {} : request["param"], selectedNode.param);
        return selectedNode.node;
    }
    node: RouterNode;
    $preRouters: string;
    dependencies: { [name: string]: Service | IModuleInfo; } = { KanroManager: { name: "kanro", version: "*" } };
    container: INodeContainer<RequestDiverter>;
    logger: ILogger;

    constructor(container: INodeContainer<RequestDiverter>) {
        super(container);
        this.$preRouters = container["$preRouters"] != undefined ? container["$preRouters"] : "";
        this.container = container;
    }

    async onDependenciesFilled() {
        this.logger = (<KanroManager>this.dependencies.KanroManager).registerLogger("Router", AnsiStyle.create().foreground(Colors.red));

        this.container.next = [];
        this.node = new RouterNode(undefined);
        for (let name in this.container) {
            if (name.startsWith("/")) {
                this.container.next.push(this.container[name]);
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

    addRouterKeyToNextRouter(key: string, node: INodeContainer<Node>[] | INodeContainer<Node>) {
        let result = false;

        if (node == undefined) {
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

        if (node.name == this.name) {
            let router = <INodeContainer<Router>>node;
            if (router.instance.$preRouters == undefined) {
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

        return result || this.addRouterKeyToNextRouter(key, node["next"]);
    }
}