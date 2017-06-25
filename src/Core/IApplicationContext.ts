import { IKanroConfigs } from "../Config";
import { ModuleManager } from "./ModuleManager";
import { ServiceManager } from "./ServiceManager";
import { LoggerManager } from "./LoggerManager";
import { Application } from "./Application";

export interface IApplicationContext {
    moduleManager?: ModuleManager;
    serviceManager?: ServiceManager;
    LoggerManager?: LoggerManager;
    configs: IKanroConfigs;
    application: Application;
}