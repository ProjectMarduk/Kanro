import { IRequest, IResponse } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A responder, a HTTP request will be input, then this executor will respond this request, convert this request to a response, output result response to next executor.
 * 
 * Note: You can use the 'request.respond()' method to convert request to a response.
 * 
 * @export
 * @interface IResponder
 * @extends {IRoutingNode}
 * @see IRequest
 */
export interface IResponder extends IExecutor {
    /**
     * Convert request to response.
     * 
     * @param {IRequest} request The input request.
     * @returns {Promise<IResponse>} Result response.
     * 
     * @memberOf IResponder
     */
    respond(request: IRequest): Promise<IResponse>;
    /**
     * Type of this executor, must be 'Responder'.
     * 
     * @type {ExecutorType.Responder}
     * @memberOf IResponder
     */
    type: ExecutorType.Responder;
}