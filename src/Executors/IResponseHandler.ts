import { IResponse } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A response handler, a HTTP response will be input, then this executor will handle it and output the result to next executor.
 * 
 * You can implement this interface by response validator or rewrite this response.
 * 
 * @export
 * @interface IResponseHandler
 * @extends {IRoutingNode}
 */
export interface IResponseHandler extends IExecutor {
    /**
     * Handle this response.
     * 
     * @param {IResponse} response The input response.
     * @returns {Promise<IResponse>} Result response.
     * 
     * @memberOf IResponseHandler
     */
    handler(response: IResponse): Promise<IResponse>;
    /**
     * Type of this executor, must be 'ResponseHandler'.
     * 
     * @type {ExecutorType.ResponseHandler}
     * @memberOf IResponseHandler
     */
    type: ExecutorType.ResponseHandler;
}