import * as Cluster from "cluster";
import * as Stream from "stream";
import { AnsiStyle } from "./AnsiStyle";
import { Colors } from "./Colors";
import { CoreLogger } from "./CoreLogger";
import { ILogger } from "./ILogger";
import { LoggerUtils, StringUtils, TimeUtils } from "../Utils";
import { LogLevel } from "./LogLevel";
import { Style } from "./Style";


export class Logger implements ILogger {
    private namespace: string;
    private style: AnsiStyle;

    constructor(namespace: string, style: AnsiStyle) {
        this.style = style;
        this.namespace = style.styling(StringUtils.rightPad(namespace, 16, " "));
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
            LogLevel.error,
            message,
            TimeUtils.getTimePassed(CoreLogger.time),
            this.style), LogLevel.error);
    }

    success(message: string): void {
        this.log(LoggerUtils.buildLogString(
            this.namespace,
            LogLevel.success,
            message,
            TimeUtils.getTimePassed(CoreLogger.time),
            this.style), LogLevel.success);
    }

    warning(message: string): void {
        this.log(LoggerUtils.buildLogString(
            this.namespace,
            LogLevel.warning,
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