import { IRequest } from "../Http";
import { IExecutor } from "./IExecutor";
import { ExecutorType } from "./ExecutorType";

/**
 * A fuse, a error and request information will be input, if this fuse understand this error, it will output a request to next executor.
 * 
 * You can implement this interface by service degradation.
 * 
 * @export
 * @interface IFuse
 * @extends {IRoutingNode}
 */
export interface IFuse extends IExecutor {
    /**
     * Fusing, if this fuse understand this error, return the request, otherwise return undefined.
     * 
     * @param {Error} err The error which occurred.
     * @param {IRequest} request Request information.
     * @returns {Promise<IRequest>} Result request or undefined.
     * 
     * @memberOf IFuse
     */
    fusing(err: Error, request: IRequest): Promise<IRequest>;
    /**
     * Type of this executor, must be 'Fuse'.
     * 
     * @type {ExecutorType.Fuse}
     * @memberOf IFuse
     */
    type: ExecutorType.Fuse;
}