import { Node } from "./Node";
import { INodeContainer } from "./INodeContainer";

/**
 * A service which can be used in Kanro.
 * 
 * @export
 * @abstract
 * @class Service
 * @extends {Node}
 */
export abstract class Service extends Node {
    constructor(container: INodeContainer<Service>) {
        super(container);
    }
}