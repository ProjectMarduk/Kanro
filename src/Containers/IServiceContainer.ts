import { IModuleInfo } from "../Core";
import { IService } from "../Executors";

export interface IServiceContainer {
    name: string;
    type: "Service";
    module: IModuleInfo;
    instance?: IService;
    dependencies?: IServiceContainer[];
}