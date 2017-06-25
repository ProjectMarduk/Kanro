import { ExecutorType } from "./ExecutorType";

/**
 * Information of a Kanro executor.
 * 
 * @export
 * @interface IExecutorInfo
 */
export interface IExecutorInfo {
    /**
     * Type of executor.
     * 
     * @type {ExecutorType}
     * @memberOf IExecutorInfo
     */
    type: ExecutorType;
    /**
     * Name of executor.
     * 
     * @type {string}
     * @memberOf IExecutorInfo
     */
    name: string;
}