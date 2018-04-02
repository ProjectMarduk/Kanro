import { Service, IModuleInfo } from "./Core";
import { IAppConfig } from "./IAppConfig";
import { Logger, Colors, AnsiStyle, ILogger } from "./Logging";
import { LoggerManager } from "./LoggerManager";
import { Application } from "./Application";
import { KanroInternalModule } from "./KanroInternalModule";

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
    }

    public get isProxable(){
        return false;
    }

    constructor() {
        super(undefined);
    }

    async onLoaded(): Promise<void> {
        this.getDependedService<LoggerManager>("loggerManager");
    }

    public getKanroConfig(name: string): any{
        return this.getDependedService<Application>("application").config[name];
    }

    public registerLogger(namespace: string, style?: AnsiStyle): ILogger{
        return this.getDependedService<LoggerManager>("loggerManager").registerLogger(namespace, style);
    }
}