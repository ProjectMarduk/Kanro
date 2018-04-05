import { AnsiStyle, Colors, ILogger, Logger } from "./Logging";
import { Application } from "./Application";
import { IAppConfig } from "./IAppConfig";
import { IModuleInfo, Service } from "./Core";
import { KanroInternalModule } from "./KanroInternalModule";
import { LoggerManager } from "./LoggerManager";

export class KanroManager extends Service {
    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        },
        application: {
            name: Application.name,
            module: KanroInternalModule.moduleInfo
        }
    };

    readonly isProxable: boolean = false;
    private application: Application;
    private loggerManager: LoggerManager;

    async onLoaded(): Promise<void> {
        this.application = await this.getDependedService<Application>("application");
        this.loggerManager = await this.getDependedService<LoggerManager>("loggerManager");
    }

    async getKanroConfig(name: string): Promise<any> {
        return this.application.config[name];
    }

    async registerLogger(namespace: string, style?: AnsiStyle): Promise<ILogger> {
        return this.loggerManager.registerLogger(namespace, style);
    }
}