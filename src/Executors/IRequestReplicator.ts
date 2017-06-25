import { IRequest } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A request replicator, a HTTP request will be input, then this executor will copy the input request, return a request list.
 * 
 * You can implement this interface by async request handler.
 * 
 * Note: the count of returns must be equal to 'count' param, and the first of returns must be original request.
 * 
 * @export
 * @interface IRequestDiverter
 * @extends {IRoutingNode}
 */
export interface IRequestReplicator extends IExecutor {
    /**
     * Copy request.
     * 
     * @param {IRequest} request The request will be copied.
     * @param {number} count Count of the returns.
     * @returns {Promise<IRequest[]>} Result request list.
     * 
     * @memberOf IRequestReplicator
     */
    copy(request: IRequest, count: number): Promise<IRequest[]>;
    /**
     * Type of this executor, must be 'RequestReplicator'.
     * 
     * @type {ExecutorType.RequestReplicator}
     * @memberOf IRequestReplicator
     */
    type: ExecutorType.RequestReplicator;
}