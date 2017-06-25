import { IService } from "../Executors";
import { ILogger } from "../Logger";

export interface ILoggerManager extends IService {
    registerLogger(namespace: string): ILogger;

    getLogger(namespace: string): ILogger;
}