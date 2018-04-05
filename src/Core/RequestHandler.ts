import { INodeContainer } from "./INodeContainer";
import { IRequest } from "../Http";
import { Node } from "./Node";

/**
 * A request handler, a HTTP request will be input, then this node will handle it and output the result to next node.
 *
 * You can implement this interface by request validator, authenticator or rewrite this request.
 *
 * @export
 * @abstract
 * @class RequestHandler
 * @extends {Node}
 */
export abstract class RequestHandler extends Node {
    /**
     * Handle the request.
     *
     * @param {IRequest} request The request will be handle.
     * @returns {Promise<IRequest>} The handled request.
     *
     * @memberof RequestHandler
     */
    abstract handler(request: IRequest): Promise<IRequest>;

    constructor(container: INodeContainer<RequestHandler>) {
        super(container);
    }
}