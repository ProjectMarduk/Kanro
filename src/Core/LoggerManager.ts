import { ILogger, LoggerFactory } from "../Logger";
import { IService, ExecutorType } from "../Executors";
import { ILoggerManager } from "./ILoggerManager";
import { IModuleInfo } from "./IModuleInfo";

export class LoggerManager implements ILoggerManager {
    private loggers: { [namespace: string]: ILogger } = {};

    registerLogger(namespace: string): ILogger {
        if (this.loggers[namespace] == undefined) {
            this.loggers[namespace] = LoggerFactory.buildLogger(namespace);
        }

        return this.loggers[namespace];
    }
    getLogger(namespace: string): ILogger {
        return this.loggers[namespace];
    }

    type: ExecutorType.Service = ExecutorType.Service;
    dependencies: { [name: string]: IService | IModuleInfo; };
    name: string = "LoggerManager";

    get App(): ILogger {
        return this.loggers["Kanro:App"];
    }

    get Module(): ILogger {
        return this.loggers["Kanro:Module"];
    }

    get HTTP(): ILogger {
        return this.loggers["Kanro:HTTP"];
    }

    get NPM(): ILogger {
        return this.loggers["Kanro:NPM"];
    }

    get Config(): ILogger {
        return this.loggers["Kanro:Config"];
    }

    get Router(): ILogger {
        return this.loggers["Kanro:Router"];
    }

    get Service(): ILogger {
        return this.loggers["Kanro:Service"];
    }

    constructor() {
        this.registerLogger("Kanro:App");
        this.registerLogger("Kanro:Module");
        this.registerLogger("Kanro:HTTP");
        this.registerLogger("Kanro:NPM");
        this.registerLogger("Kanro:Config");
        this.registerLogger("Kanro:Router");
        this.registerLogger("Kanro:Service");
    }
}