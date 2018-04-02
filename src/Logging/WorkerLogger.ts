import * as Cluster from "cluster";
import { ILogger } from "./ILogger";
import { AnsiStyle } from "./AnsiStyle";
import { LogLevel } from "./LogLevel";
import { StringUtils } from "../Utils/index";
import { LoggerUtils } from "../Utils/LoggerUtils";
import { TimeUtils } from "../Utils/TimeUtils";
import { CoreLogger } from "./CoreLogger";

export class WorkerLogger implements ILogger {
    private namespace: string;
    private style: AnsiStyle;
    
    constructor(namespace: string) {
        let color = Number(Cluster.worker.id) % 7;

        this.style = AnsiStyle.create().foreground(color + 1);
        this.namespace = this.style.styling(StringUtils.rightPad(namespace, 16, ' '));
    }
    
    public info(message: string) {
        this.log(LoggerUtils.buildLogString(this.namespace, LogLevel.info, message, TimeUtils.getTimePassed(CoreLogger.time), this.style), LogLevel.info);
    }

    public error(message: string) {
        this.log(LoggerUtils.buildLogString(this.namespace, LogLevel.error, message, TimeUtils.getTimePassed(CoreLogger.time), this.style), LogLevel.error);
    }

    public success(message: string) {
        this.log(LoggerUtils.buildLogString(this.namespace, LogLevel.success, message, TimeUtils.getTimePassed(CoreLogger.time), this.style), LogLevel.success);
    }

    public warning(message: string) {
        this.log(LoggerUtils.buildLogString(this.namespace, LogLevel.warning, message, TimeUtils.getTimePassed(CoreLogger.time), this.style), LogLevel.warning);
    }

    private log(message: string, level: LogLevel) {
        if (LoggerUtils.isErrorOutput(level)) {
            CoreLogger.current.error(message);
        }
        else {
            CoreLogger.current.log(message);
        }
    }
}