/**
 * Module manager is a service which is provided by Kanro, you can use this service to manage modules.
 * 
 * @export
 * @interface IModuleManager
 * @extends {IService}
 */
import { IExecutorContainer } from "../Containers";
import { IExecutor, IService } from "../Executors";
import { IModule } from "./IModule";

export interface IModuleManager extends IService {
    /**
     * Install a module, if it have been installed, set reinstall to 'true' to reinstall it.
     * 
     * @param {string} name Name of module.
     * @param {string} version Version of module.
     * @param {boolean} [reinstall] Reinstall module.
     * @returns {Promise<IModule>} The module instance.
     * 
     * @memberOf IModuleManager
     */
    installModule(name: string, version: string, reinstall?: boolean): Promise<IModule>;
    /**
     * Check a module have been installed or not.
     * 
     * @param {string} name Name of module.
     * @param {string} version Version of module.
     * @returns {boolean} This module have been installed or not.
     * 
     * @memberOf IModuleManager
     */
    isModuleInstalled(name: string, version: string): boolean;
    /**
     * Get a installed module instance.
     * 
     * @param {string} name Name of module.
     * @param {string} version Version of module.
     * @returns {IModule} The module instance.
     * 
     * @memberOf IModuleManager
     */
    getModule(name: string, version: string): IModule;
    /**
     * Get a executor instance of a installed module.
     * 
     * @param {Config.IExecutorConfig} config Executor config.
     * @returns {Promise<IExecutor>} The executor instance.
     * 
     * @memberOf IModuleManager
     */
    getExecutor(config: IExecutorContainer): Promise<IExecutor>;
}