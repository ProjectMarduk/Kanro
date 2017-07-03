import * as Cluster from "cluster";
import * as Stream from 'stream'

import { StringUtils, TimeUtils, LoggerUtils } from '../Utils';
import { Colors } from './Colors';
import { Style } from "./Style";
import { AnsiStyle } from "./AnsiStyle";
import { LogLevel } from "./LogLevel";
import { CoreLogger } from "./CoreLogger";
import { ILogger } from "./ILogger";

export class Logger implements ILogger {
    private namespace: string;
    private style: AnsiStyle;

    constructor(namespace: string, style: AnsiStyle) {
        this.style = style;
        this.namespace = style.styling(StringUtils.rightPad(namespace, 16, ' '));
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