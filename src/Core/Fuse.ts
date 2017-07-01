import { IRequest } from "../Http";
import { Node } from "./Node";
import { INodeContainer } from "./INodeContainer";

/**
 * A fuse, a error and request information will be input, if this fuse understand this error, it will output a request to next node.
 * 
 * You can implement this interface by service degradation.
 * 
 * @export
 * @abstract
 * @class Fuse
 * @extends {Node}
 */
export abstract class Fuse extends Node {
    /**
     * Fusing, if this fuse understand this error, return the request, otherwise return undefined.
     * 
     * @abstract
     * @param {Error} err The error which occurred.
     * @param {IRequest} request Request information.
     * @returns {Promise<IRequest>} Result request or undefined.
     * @memberof Fuse
     */
    public abstract fusing(err: Error, request: IRequest): Promise<IRequest>;

    constructor(container: INodeContainer<Fuse>) {
        super(container);
    }
}
