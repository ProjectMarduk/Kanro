import { BaseExecutor, IRequestDiverter, ExecutorType, IService, IExecutor } from "../Executors";
import { IRequest, Request } from "../Http";
import { IExecutorContainer, IRequestDiverterContainer } from "../Containers";
import { NotFoundException } from "../Exceptions";
import { IModuleInfo } from "../Core";
import { ModuleInfo } from "..";
import { RouterResult } from "./RouterResult";
import { RouterNode } from "./RouterNode";

export class Router extends BaseExecutor implements IRequestDiverter {
    async shunt(request: IRequest, nodes: IExecutorContainer[]): Promise<IExecutorContainer> {
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

        if (selectedNode == undefined || selectedNode.executor == undefined) {
            throw new NotFoundException();
        }

        (<Request>request).routerIndex = deep;
        request["param"] = Object.assign(request["param"] == undefined ? {} : request["param"], selectedNode.param);
        return selectedNode.executor;
    }
    type: ExecutorType.RequestDiverter = ExecutorType.RequestDiverter;
    name: string = "KanroRouter";
    node: RouterNode;
    preRouters: string;
    dependencies: { [name: string]: IService | IModuleInfo; } = {};
    config: IRequestDiverterContainer;

    constructor(config: IRequestDiverterContainer) {
        super(config);
        this.preRouters = config["preRouters"] != undefined ? config["preRouters"] : "";
        this.config = config;
        this.dependencies["LoggerManager"] = ModuleInfo;
    }

    async onLoaded() {
        this.config.next = [];
        this.node = new RouterNode(undefined);
        for (let name in this.config) {
            if (name.startsWith("/")) {
                this.config.next.push(this.config[name]);
                this.node.addRouter(this.config[name], name);
                if (name.endsWith("/**")) {
                    if (this.addRouterKeyToNextRouter(`${this.preRouters}${name.slice(0, name.length - 3)}`, this.config[name])) {
                        continue;
                    }
                }
                (<any>this.dependencies["LoggerManager"]).Router.success(`Router node '${this.preRouters}${name}' added`);
            }
        }
    }

    addRouterKeyToNextRouter(key: string, executor: IExecutor[] | IExecutor) {
        let result = false;

        if (executor == undefined) {
            return;
        }

        if (key.endsWith("/")) {
            key = key.slice(0, key.length - 1);
        }
        if (Array.isArray(executor)) {
            for (let e of executor) {
                result = result || this.addRouterKeyToNextRouter(key, e);
            }
            return result;
        }

        if (executor.name == this.name) {
            let router = <Router>executor;
            if (router.preRouters == undefined) {
                router.preRouters = "";
            }
            router.preRouters += key;

            for (let routerKey in router) {
                if (routerKey.startsWith("/")) {
                    this.addRouterKeyToNextRouter(key, router[routerKey]);
                }
            }

            result = true;
        }

        return result || this.addRouterKeyToNextRouter(key, executor["next"]);
    }
}