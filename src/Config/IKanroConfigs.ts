import { IAppConfig } from "./IAppConfig";
import { IModulesConfig } from "./IModulesConfig";
import { IServicesConfig } from "./IServicesConfig";
import { IExecutorsConfig } from "./IExecutorsConfig";

export interface IKanroConfigs {
    appConfig?: IAppConfig;
    modulesConfig?: IModulesConfig;
    serviceConfig?: IServicesConfig;
    executorsConfig?: IExecutorsConfig;
}