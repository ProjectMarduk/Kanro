import { IExceptionHandler } from "../Executors";
import { IModuleInfo } from "../Core";
import { IExceptionHandlerContainer } from "./IExceptionHandlerContainer";
import { IFuseContainer } from "./IFuseContainer";
import { IServiceContainer } from "./IServiceContainer";

export interface IExecutorContainer {
    name: string;
    module: IModuleInfo;
    type: string;
    exceptionHandlers?: IExceptionHandlerContainer[];
    fuses?: IFuseContainer[];
    dependencies?: IServiceContainer[];
}