import { INodeContainer } from "../Core";
import { InvalidRouterConfigException } from "../Exceptions";
import { ObjectUtils, StringUtils } from "../Utils";
import { Request } from "../Http";
import { RouterKey } from "./RouterKey";
import { RouterKeyType } from "./RouterKeyType";
import { RouterResult } from "./RouterResult";
import { UrlRouter } from "./UrlRouter";

export class RouterNode {
    path: string;
    children: { [name: string]: RouterNode } = {};
    node: INodeContainer<UrlRouter>;
    routerKey: RouterKey;


    constructor(path: string) {
        this.path = path;
        if (path != null) {
            this.routerKey = new RouterKey(path);
        }
    }

    addRouter(node: INodeContainer<UrlRouter>, routerKey: string): void {
        let keys: string[] = StringUtils.routerPathSplit(routerKey).reverse();
        this.add(node, keys);
    }

    private add(node: INodeContainer<UrlRouter>, keys: string[]): void {
        if (keys.length === 0) {
            if (this.node != null) {
                throw new InvalidRouterConfigException("Duplicate router config be provided.");
            }
            this.node = node;
            return;
        }

        if (this.routerKey != null && this.routerKey.key === "**" && keys.length > 0) {
            throw new Error("Cannot use '**' as a middle node");
        }

        let key: string = keys.pop();

        if (this.children[key] == null) {
            this.children[key] = new RouterNode(key);
        }

        this.children[key].add(node, keys);
    }

    matchRequest(request: Request,
        deep: number = 0,
        routerStack: RouterKey[] = [],
        param: { [name: string]: string } = {}): RouterResult[] {
        if (this.path == null) {
            if (request.routerKey.length === deep && this.node != null) {
                return [new RouterResult(this.node, deep, [], {})];
            }
            let results: RouterResult[] = [];
            for (let name in this.children) {
                if (this.children.hasOwnProperty(name)) {
                    let result: RouterResult[] = this.children[name].matchRequest(request, deep, routerStack, { ...param });

                    if (Array.isArray(result)) {
                        results = results.concat(result);
                        continue;
                    }
                }
            }
            return results;
        }

        let key: string = request.routerKey[deep];
        routerStack.push(this.routerKey);

        if (this.routerKey.match(key) && (deep <= request.routerKey.length)) {
            if (this.routerKey.type === RouterKeyType.Param) {
                param[this.routerKey.key] = key;
            } else if (this.routerKey.type === RouterKeyType.Wildcard && this.routerKey.key === "**") {
                if (this.node == null) {
                    return [];
                }
                return [new RouterResult(this.node, deep, this.forkAndPopRouterStack(routerStack), param)];
            }

            if (deep >= request.routerKey.length - 1 && this.node != null) {
                return [new RouterResult(this.node, deep, this.forkAndPopRouterStack(routerStack), param)];
            } else {
                let results: RouterResult[] = [];
                for (let name in this.children) {
                    if (this.children.hasOwnProperty(name)) {
                        let result: RouterResult[] = this.children[name].matchRequest(request, deep + 1, routerStack, { ...param });

                        if (Array.isArray(result)) {
                            results = results.concat(result);
                            continue;
                        }
                    }
                }

                routerStack.pop();
                return results;
            }
        } else {
            routerStack.pop();
            return [];
        }
    }

    forkAndPopRouterStack(routerStack: RouterKey[]): RouterKey[] {
        let stack: RouterKey[] = ObjectUtils.copy(routerStack);
        routerStack.pop();
        return stack;
    }
}