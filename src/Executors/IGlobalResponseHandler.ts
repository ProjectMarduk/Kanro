import { IResponse } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A global response handler, a HTTP response will be input, then this executor will handle it and output the result to next global response handler.
 * 
 * You can implement this interface by response logger.
 * 
 * @export
 * @interface IResponseHandler
 * @extends {IRoutingNode}
 */
export interface IGlobalResponseHandler extends IExecutor {
    /**
     * Handle this response.
     * 
     * @param {IResponse} response The input response.
     * @returns {Promise<IResponse>} Result response.
     * 
     * @memberOf IGlobalResponseHandler
     */
    handler(response: IResponse): Promise<IResponse>;
    /**
     * Type of this executor, must be 'GlobalResponseHandler'.
     * 
     * @type {ExecutorType.GlobalResponseHandler}
     * @memberOf IGlobalResponseHandler
     */
    type: ExecutorType.GlobalResponseHandler;
}