import { IExecutorContainer } from "../Containers";
import { StringUtils, ObjectUtils } from "../Utils";
import { InvalidRouterConfigException } from "../Exceptions";
import { Request } from "../Http"
import { RouterKey } from "./RouterKey";
import { RouterResult } from "./RouterResult";
import { RouterKeyType } from "./RouterKeyType";

export class RouterNode {
    path: string;
    children: { [name: string]: RouterNode } = {};
    executor: IExecutorContainer;
    routerKey: RouterKey;


    constructor(path: string) {
        this.path = path;
        if (path != undefined) {
            this.routerKey = new RouterKey(path);
        }
    }

    addRouter(executor: IExecutorContainer, routerKey: string) {
        let keys = StringUtils.pathSplit(routerKey).reverse();
        this.add(executor, keys);
    }

    private add(executor: IExecutorContainer, keys: string[]) {
        if (keys.length == 0) {
            if (this.executor != null) {
                throw new InvalidRouterConfigException("Duplicate router config be provided.");
            }
            this.executor = executor;
            return;
        }

        if (this.routerKey != undefined && this.routerKey.key == "**" && keys.length > 0) {
            throw new Error("Cannot use '**' as a middle node");
        }

        let key = keys.pop();

        if (this.children[key] == undefined) {
            this.children[key] = new RouterNode(key);
        }

        this.children[key].add(executor, keys);
    }

    matchRequest(request: Request, deep: number = 0, routerStack: RouterKey[] = [], param: { [name: string]: string } = {}): RouterResult[] {
        if (this.path == undefined) {
            if (request.routerKey.length == deep && this.executor != undefined) {
                return [new RouterResult(this.executor, deep, [], {})];
            }
            let results = [];
            for (let name in this.children) {
                let result = this.children[name].matchRequest(request, deep, routerStack, { ...param });

                if (Array.isArray(result)) {
                    results = results.concat(result);
                    continue;
                }
            }
            return results;
        }

        let key = request.routerKey[deep];
        routerStack.push(this.routerKey);

        if (this.routerKey.match(key) && (deep <= request.routerKey.length)) {
            if (this.routerKey.type == RouterKeyType.Param) {
                param[this.routerKey.key] = key;
            }
            else if (this.routerKey.type == RouterKeyType.Wildcard && this.routerKey.key == "**") {
                if (this.executor == undefined) {
                    return [];
                }
                return [new RouterResult(this.executor, deep, this.forkAndPopRouterStack(routerStack), param)];
            }

            if (deep >= request.routerKey.length - 1 && this.executor != undefined) {
                return [new RouterResult(this.executor, deep, this.forkAndPopRouterStack(routerStack), param)];
            }
            else {
                let results = [];
                for (let name in this.children) {
                    let result = this.children[name].matchRequest(request, deep + 1, routerStack, { ...param });

                    if (Array.isArray(result)) {
                        results = results.concat(result);
                        continue;
                    }
                }

                routerStack.pop();
                return results;
            }
        }
        else {
            routerStack.pop();
            return [];
        }
    }

    forkAndPopRouterStack(routerStack: RouterKey[]) {
        let stack = ObjectUtils.copy(routerStack);
        routerStack.pop();
        return stack;
    }
}