import { IAppConfig } from "../IAppConfig";
import { LogLevel } from "../Logging";

export interface IMessage {
    type: string;
}

export interface ILogMessage extends IMessage {
    type : "log";
    level: LogLevel;
    namespace: string;
    message: string;
    style: string;
}

export interface IConfigMessage extends IMessage {
    type : "log";
    config: IAppConfig;
}