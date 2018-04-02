import { IModuleInfo } from "./IModuleInfo";
import { INodeContainer } from "./INodeContainer";
import { Service } from "./Service";
import { INodeReference } from "./INodeReference";

/**
 * A node which can be used in Kanro.
 * 
 * @export
 * @abstract
 * @class Node
 */
export abstract class Node {
    /**
     * The services which be dependent by this node.
     * 
     * If a named 'undefined' property in this object, Kanro will find service in all loaded module and set service instance to property.
     * 
     * If a named 'INodeContainer<Service>' property in this object, Kanro will find service in specified module and set service instance to property.
     * 
     * @type {({ [name: string]: Service | INodeContainer<Service>; })}
     * @memberof Node
     */
    dependencies: { [name: string]: Service | INodeContainer<Service>; } = {};

    /**
     * Name of node, it will return class name by default.
     * 
     * @type {string}
     * @memberof Node
     */
    public get name(): string {
        return this.constructor.name;
    }

    /**
     * Creates an instance of Node.
     * @param {INodeContainer} container 
     * @memberof Node
     */
    constructor(container: INodeContainer<Node>) {

    }

    /**
     * This method will be called by kanro when node has been create.
     * 
     * @returns {Promise<void>} 
     * @memberof Node
     */
    public async onCreated(): Promise<void> {

    }

    /**
     * This method will be called by kanro when dependencies is filled to 'Node.dependencies'.
     * 
     * @returns {Promise<void>} 
     * @memberof Node
     */
    public async onLoaded(): Promise<void> {

    }

    public getDependedService<T extends Service>(name: string): T{
        return <T><any>this.dependencies[name];
    }
}