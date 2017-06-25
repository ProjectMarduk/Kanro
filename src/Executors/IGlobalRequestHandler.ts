import { IRequest } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A global request handler, a HTTP request will be input, then this executor will handle it and output the result to next global request handler.
 * 
 * You can implement this interface by request logger or authenticator.
 * 
 * @export
 * @interface IGlobalRequestHandler
 * @extends {IRoutingNode}
 */
export interface IGlobalRequestHandler extends IExecutor {
    /**
     * Handle this request.
     * 
     * @param {IRequest} request The request will be handle.
     * @returns {Promise<IRequest>} The handled request.
     * 
     * @memberOf IRequestHandler
     */
    handler(request: IRequest): Promise<IRequest>;
    /**
     * Type of this executor, must be 'GlobalRequestHandler'.
     * 
     * @type {ExecutorType.GlobalRequestHandler}
     * @memberOf IGlobalRequestHandler
     */
    type: ExecutorType.GlobalRequestHandler;
}