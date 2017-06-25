import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A service which can be used in Kanro.
 * 
 * @export
 * @interface IService
 * @extends {IExecutor}
 */
export interface IService extends IExecutor {
    type: ExecutorType.Service;
}