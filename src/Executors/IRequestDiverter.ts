import { IRequest } from "../Http";
import { IExecutorContainer } from "../Containers";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A request diverter, a HTTP request will be input, then this executor will select next executor which will handle the request in executors list.
 * 
 * You can implement this interface by request router, load balancing.
 * 
 * @export
 * @interface IRequestDiverter
 * @extends {IRoutingNode}
 */
export interface IRequestDiverter extends IExecutor {
    /**
     * Divert this request.
     * 
     * @param {IRequest} request The request will be diverted.
     * @param {IRoutingNode[]} executors Executors list.
     * @returns {Promise<number>} Selected executor.
     * 
     * @memberOf IRequestDiverter
     */
    shunt(request: IRequest, executors: IExecutorContainer[]): Promise<IExecutorContainer>;
    /**
     * Type of this executor, must be 'RequestDiverter'.
     * 
     * @type {ExecutorType.RequestDiverter}
     * @memberOf IRequestDiverter
     */
    type: ExecutorType.RequestDiverter;
}