import * as Cluster from "cluster";
import { AnsiStyle, Colors, ILogger, Logger, WorkerLogger } from "./Logging";
import { Service } from "./Core";

export class LoggerManager extends Service {
    private loggers: { [namespace: string]: ILogger } = {};

    readonly isProxable: boolean = false;

    registerLogger(namespace: string, style?: AnsiStyle): ILogger {
        if (this.loggers[namespace] == null) {
            if (Cluster.isMaster) {
                this.loggers[namespace] = new Logger(`Kanro:${namespace}`, style);
            } else {
                this.loggers[namespace] = new WorkerLogger(`Worker:${Cluster.worker.id}:${namespace}`);
            }
        }

        return this.loggers[namespace];
    }
    getLogger(namespace: string): ILogger {
        return this.loggers[namespace];
    }

    constructor() {
        super(undefined);
    }
}