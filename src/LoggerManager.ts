import * as Cluster from "cluster";
import { Logger, Colors, AnsiStyle, ILogger, WorkerLogger } from "./Logging";

export class LoggerManager {
    private loggers: { [namespace: string]: ILogger } = {};

    registerLogger(namespace: string, style?: AnsiStyle): ILogger {
        if (this.loggers[namespace] == undefined) {
            if (Cluster.isMaster) {
                this.loggers[namespace] = new Logger(`Kanro:${namespace}`, style);
            }
            else {
                this.loggers[namespace] = new WorkerLogger(`Worker:${Cluster.worker.id}:${namespace}`);
            }
        }

        return this.loggers[namespace];
    }
    getLogger(namespace: string): ILogger {
        return this.loggers[namespace];
    }

    private constructor() {
    }

    private static instance: LoggerManager;
    public static get current() {
        if (LoggerManager.instance == undefined) {
            LoggerManager.instance = new LoggerManager();
        }

        return LoggerManager.instance;
    }
}