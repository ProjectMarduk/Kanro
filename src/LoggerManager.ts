import { Logger, Colors } from "./Logging";

export class LoggerManager {
    private loggers: { [namespace: string]: Logger } = {};

    registerLogger(namespace: string, color: Colors): Logger {
        if (this.loggers[namespace] == undefined) {
            this.loggers[namespace] = new Logger(namespace, color);
        }

        return this.loggers[namespace];
    }
    getLogger(namespace: string): Logger {
        return this.loggers[namespace];
    }

    private constructor() {
    }

    private static instance : LoggerManager;
    public static get current(){
        if(LoggerManager.instance == undefined){
            LoggerManager.instance = new LoggerManager();
        }

        return LoggerManager.instance;
    }
}