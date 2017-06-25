import { IRequest, IResponse } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A exception handler, a error and other information will be input, if this executor understand this error, it will output a response.
 * 
 * You can implement this interface by friendly error message output.
 * 
 * @export
 * @interface IExceptionHandler
 * @extends {IRoutingNode}
 */
export interface IExceptionHandler extends IExecutor {
    /**
     * If this executor understand this error, return the response, otherwise return undefined.
     * 
     * @param {Error} err The error which occurred.
     * @param {IRequest} request Request information.
     * @param {IResponse} response Response information.
     * @returns {Promise<IResponse>} Result response or undefined.
     * 
     * @memberOf IExceptionHandler
     */
    handler(err: Error, request: IRequest, response: IResponse): Promise<IResponse>;
    /**
     * Type of this executor, must be 'ExceptionHandler'.
     * 
     * @type {ExecutorType.ExceptionHandler}
     * @memberOf IExceptionHandler
     */
    type: ExecutorType.ExceptionHandler;
}
