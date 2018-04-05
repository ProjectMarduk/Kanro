import { INodeContainer } from "./INodeContainer";
import { IRequest, IResponse } from "../Http";
import { Node } from "./Node";

/**
 * A exception handler, a error and other information will be input, if this node understand this error, it will output a response.
 *
 * You can implement this interface by friendly error message output.
 *
 * @abstract
 * @class ExceptionHandler
 * @extends {Node}
 */
export abstract class ExceptionHandler extends Node {
    /**
     * If this node understand this error, return the response, otherwise return undefined.
     *
     * @abstract
     * @param {Error} err The error which occurred.
     * @param {IRequest} request Request information.
     * @param {IResponse} response Response information.
     * @returns {Promise<IResponse>} Result response or undefined.
     * @memberof ExceptionHandler
     */
    abstract handler(err: Error, request: IRequest, response: IResponse): Promise<IResponse>;

    constructor(container: INodeContainer<ExceptionHandler>) {
        super(container);
    }
}