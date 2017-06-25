/**
 * Kanro manager is a service which is provided by Kanro, you can use this service to manage Kanro.
 * 
 * @export
 * @interface IKanroManager
 * @extends {IService}
 */
import { IService } from "../Executors";
import { IKanroConfigs } from "../Config";

export interface IKanroManager extends IService {
    /**
     * Reload configs, if config is undefined, the local configs will be used.
     * 
     * @param {Config.IKanroConfigs} configs 
     * @returns {Promise<void>} 
     * 
     * @memberOf IKanroManager
     */
    reloadConfigs(configs: IKanroConfigs): Promise<void>;

    /**
     * Get a config from Kanro config, ect: 'port', 'registry' or 'resource'
     * 
     * @param {string} key 
     * @returns {*} 
     * 
     * @memberOf IKanroManager
     */
    getKanroConfig(key: string): any;
}