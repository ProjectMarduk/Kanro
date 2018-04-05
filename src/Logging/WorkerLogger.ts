import * as Cluster from "cluster";
import { AnsiStyle } from "./AnsiStyle";
import { CoreLogger } from "./CoreLogger";
import { ILogger } from "./ILogger";
import { LoggerUtils } from "../Utils/LoggerUtils";
import { LogLevel } from "./LogLevel";
import { StringUtils } from "../Utils/index";
import { TimeUtils } from "../Utils/TimeUtils";

export class WorkerLogger implements ILogger {
    private namespace: string;
    private style: AnsiStyle;

    constructor(namespace: string) {
        let color: number = Number(Cluster.worker.id) % 7;
        this.style = AnsiStyle.create().foreground(color + 1);
        this.namespace = this.style.styling(StringUtils.rightPad(namespace, 16, " "));
    }

    info(message: string): void {
        this.log(LoggerUtils.buildLogString(
            this.namespace,
            LogLevel.info,
            message,
            TimeUtils.getTimePassed(CoreLogger.time),
            this.style), LogLevel.info);
    }

    error(message: string): void {
        this.log(LoggerUtils.buildLogString(
            this.namespace,
            LogLevel.info,
            message,
            TimeUtils.getTimePassed(CoreLogger.time),
            this.style), LogLevel.error);
    }

    success(message: string): void {
        this.log(LoggerUtils.buildLogString(
            this.namespace,
            LogLevel.info,
            message,
            TimeUtils.getTimePassed(CoreLogger.time),
            this.style), LogLevel.success);
    }

    warning(message: string): void {
        this.log(LoggerUtils.buildLogString(
            this.namespace,
            LogLevel.info,
            message,
            TimeUtils.getTimePassed(CoreLogger.time),
            this.style), LogLevel.warning);
    }

    private log(message: string, level: LogLevel): void {
        if (LoggerUtils.isErrorOutput(level)) {
            CoreLogger.current.error(message);
        } else {
            CoreLogger.current.log(message);
        }
    }
}