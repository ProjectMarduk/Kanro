/**
 * A module which can be used in Kanro.
 * 
 * @export
 * @interface IModule
 */
import { IExecutorInfo, IExecutor } from "../Executors";
import { IModuleInfo } from "./IModuleInfo";
import { IExecutorContainer } from "../Containers";

export interface IModule {
    /**
     * Information of this module included executors.
     * 
     * @type {{ [name: string]: IExecutorInfo }}
     * @memberOf IModule
     */
    executorInfos: { [name: string]: IExecutorInfo };
    /**
     * Dependent module, Kanro will install those module after install this module.
     * 
     * @type {IModuleInfo[]}
     * @memberOf IModule
     */
    dependencies: IModuleInfo[];
    /**
     * Get a executor by a executor config.
     * 
     * Note: Kanro 会对每个 executor config 调用这个方法，对于同样的名字的 executor 如果模块返回的是不同示例，则会导致在链路中也会使用不同的实例，反之如果对每个相同名字的 executor 都返回同一个实例，则会导致这个实例可能被用在多个链路上，如果你需要共享上下文则可以考虑这种方式。请根据具体的需求来返回单例。
     * 
     * @param {Config.IExecutorConfig} config 
     * @returns {Promise<IExecutor>} 
     * 
     * @memberOf IModule
     */
    getExecutor(config: IExecutorContainer): Promise<IExecutor>;
}