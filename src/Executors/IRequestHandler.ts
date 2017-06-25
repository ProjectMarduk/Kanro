import { IRequest } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A request handler, a HTTP request will be input, then this executor will handle it and output the result to next executor.
 * 
 * You can implement this interface by request validator, authenticator or rewrite this request.
 * 
 * @export
 * @interface IRequestHandler
 * @extends {IExecutor}
 */
export interface IRequestHandler extends IExecutor {
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
     * Type of this executor, must be 'RequestHandler'.
     * 
     * @type {ExecutorType.RequestHandler}
     * @memberOf IRequestHandler
     */
    type: ExecutorType.RequestHandler;
}