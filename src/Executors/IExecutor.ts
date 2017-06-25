import { IModuleInfo } from "../Core";
import { IExecutorInfo } from "./IExecutorInfo";
import { IService } from "./IService";

/**
* A executor which can be used in Kanro.
* 
* @export
* @interface IExecutor
* @extends {IExecutorInfo}
*/
export interface IExecutor extends IExecutorInfo {
    /**
     * The services which be dependent by this executor.
     * 
     * If a named 'undefined' property in this object, Kanro will find service in all loaded module and set service instance to property.
     * 
     * If a named 'IModuleInfo' property in this object, Kanro will find service in specified module and set service instance to property.
     * 
     * @type {{ [name: string]: IService }}
     * @memberOf IExecutor
     */
    dependencies?: { [name: string]: IService | IModuleInfo };

    onLoaded?(): Promise<void>;
}