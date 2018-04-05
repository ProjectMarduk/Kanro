import { INodeContainer } from "./INodeContainer";
import { IRequest } from "../Http";
import { Node } from "./Node";

/**
 * A request diverter, a HTTP request will be input, then this node will select next node which will handle the request in nodes list.
 *
 * You can implement this interface by request router, load balancing.
 *
 * @export
 * @abstract
 * @class RequestDiverter
 * @extends {Node}
 */
export abstract class RequestDiverter extends Node {

    /**
     * Divert the request.
     *
     * @abstract
     * @param {IRequest} request The request will be diverted.
     * @param {INodeContainer<Node>[]} nodes Nodes list.
     * @returns {Promise<INodeContainer<Node>>} Selected node.
     * @memberof RequestDiverter
     */
    abstract shunt(request: IRequest, nodes: INodeContainer<Node>[]): Promise<INodeContainer<Node>>;

    constructor(container: INodeContainer<RequestDiverter>) {
        super(container);
    }
}