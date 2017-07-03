import { Service } from "./Core";
import { IAppConfig } from "./IAppConfig";
import { Logger, Colors, AnsiStyle, ILogger } from "./Logging";
import { LoggerManager } from "./LoggerManager";
import { Application } from "./Application";

export class KanroManager extends Service {
    public get application(): Application {
        return Application.current;
    }

    constructor() {
        super({ name: KanroManager.name, module: { name: "kanro", version: "*" } });
    }

    async reloadConfigs(configs: IAppConfig): Promise<void> {
        Application.current.reloadConfigs(configs);
    }

    getKanroConfig(key: string): any {
        return Application.current.config[key];
    }

    registerLogger(namespace: string, style: AnsiStyle): ILogger {
        return LoggerManager.current.registerLogger(namespace, style);
    }
}