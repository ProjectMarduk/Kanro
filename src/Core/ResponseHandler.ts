import { INodeContainer } from "./INodeContainer";
import { IResponse } from "../Http";
import { Node } from "./Node";

/**
 * A response handler, a HTTP response will be input, then this node will handle it and output the result to next node.
 *
 * You can implement this interface by response validator or rewrite this response.
 *
 * @export
 * @abstract
 * @class ResponseHandler
 */
export abstract class ResponseHandler extends Node {
    /**
     * Handle the response.
     *
     * @abstract
     * @param {IResponse} response The input response.
     * @returns {Promise<IResponse>} Result response.
     * @memberof ResponseHandler
     */
    abstract handler(response: IResponse): Promise<IResponse>;

    constructor(container: INodeContainer<ResponseHandler>) {
        super(container);
    }
}