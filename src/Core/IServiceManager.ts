/**
 * Service manager is a service which is provided by Kanro, you can use this service to manage services.
 * 
 * @export
 * @interface IServiceManager
 * @extends {IService}
 */
import { IService } from "../Executors";
import { IServiceContainer, IExecutorContainer } from "../Containers";

export interface IServiceManager extends IService {
    /**
     * Get a service instance of a installed module.
     * 
     * @param {IServiceContainer} node 
     * 
     * @memberOf IServiceManager
     */
    getService(node: IServiceContainer);
    /**
     * Injection dependencies to executors.
     * 
     * @param {(IExecutorContainer | IExecutorContainer[])} Executors which need be injected 
     * 
     * @memberOf IServiceManager
     */
    fillServiceDependencies(node: IExecutorContainer | IExecutorContainer[]);
}