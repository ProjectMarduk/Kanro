import { ExecutorType, IService } from "../Executors";
import { IKanroConfigs } from "../Config";
import { IKanroManager } from "./IKanroManager";
import { IApplicationContext } from "./IApplicationContext";

export class KanroManager implements IKanroManager {
    type: ExecutorType.Service = ExecutorType.Service;
    dependencies: { [name: string]: IService; } = {};
    name: string = "KanroManager";
    context: IApplicationContext;

    async reloadConfigs(configs: IKanroConfigs): Promise<void> {
        await this.context.application.reloadConfigs(configs);
    }

    getKanroConfig(key: string): any {
        return this.context.configs.appConfig[key];
    }

    constructor(context: IApplicationContext) {
        this.context = context;
    }
}