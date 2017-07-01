import { Service } from "./Core";
import { IAppConfig } from "./IAppConfig";
import { Logger, Colors } from "./Logging";
import { LoggerManager } from "./LoggerManager";
import { Application } from "./Application";

export class KanroManager extends Service {
    private app: Application;


    public get application(): Application {
        return this.app;
    }

    constructor(app: Application) {
        super({ name: KanroManager.name, module: { name: "kanro", version: "*" } });
        this.app = app;
    }

    async reloadConfigs(configs: IAppConfig): Promise<void> {
        this.app.reloadConfigs(configs);
    }

    getKanroConfig(key: string): any {
        return this.app.config[key];
    }

    registerLogger(namespace: string, color: Colors): Logger {
        return LoggerManager.current.registerLogger(namespace, color);
    }
}