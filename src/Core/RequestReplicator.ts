import { IRequest } from "../Http";
import { Node } from "./Node";
import { INodeContainer } from "./INodeContainer";

/**
 * A request replicator, a HTTP request will be input, then this node will copy the input request, return a request list.
 * 
 * You can implement this interface by async request handler.
 * 
 * Note: the count of returns must be equal to 'count' param, and the first of returns must be original request.
 * 
 * @export
 * @abstract
 * @class RequestReplicator
 * @extends {Node}
 */
export abstract class RequestReplicator extends Node {
    /**
     * Copy request.
     * 
     * @abstract
     * @param {IRequest} request The request will be copied.
     * @param {number} count Count of the returns.
     * @returns {Promise<IRequest[]>} Result request list.
     * @memberof RequestReplicator
     */
    public abstract copy(request: IRequest, count: number): Promise<IRequest[]>;

    constructor(container: INodeContainer<RequestReplicator>) {
        super(container);
    }
}