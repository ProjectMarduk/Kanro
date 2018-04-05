import { INodeContainer } from "./INodeContainer";
import { IRequest, IResponse } from "../Http";
import { Node } from "./Node";

/**
 * A responder, a HTTP request will be input, then this node will respond this request,
 * convert this request to a response, output result response to next node.
 *
 * Note: You can use the 'request.respond()' method to convert request to a response.
 *
 * @export
 * @abstract
 * @class Responder
 * @extends {Node}
 */
export abstract class Responder extends Node {
    /**
     * Handle the request and give a response.
     *
     * @abstract
     * @param {IRequest} request The input request.
     * @returns {Promise<IResponse>} Result response.
     * @memberof Responder
     */
    abstract respond(request: IRequest): Promise<IResponse>;

    constructor(container: INodeContainer<Responder>) {
        super(container);
    }
}