import { IModuleInfo } from "./IModuleInfo";
import { INodeContainer } from "./INodeContainer";
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
     * If a named 'INodeContainer<Service>' property in this object,
     * Kanro will find service in specified module and set service instance to property.
     *
     * @type {({ [name: string]: INodeContainer<Service>; })}
     * @memberof Node
     */
    dependencies: { [name: string]: INodeContainer<Service>; } = {};

    /**
     * Name of node, it will return class name by default.
     *
     * @type {string}
     * @memberof Node
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * Creates an instance of Node.
     * @param {INodeContainer} container
     * @memberof Node
     */
    // tslint:disable-next-line:no-empty
    constructor(container: INodeContainer<Node>) {
    }

    /**
     * This method will be called by kanro when node has been create.
     *
     * @returns {Promise<void>}
     * @memberof Node
     */
    // tslint:disable-next-line:no-empty
    async onCreated(): Promise<void> {
    }

    /**
     * This method will be called by kanro when all dependencies are filled to 'Node.dependencies'.
     *
     * @returns {Promise<void>}
     * @memberof Node
     */
    // tslint:disable-next-line:no-empty
    async onLoaded(): Promise<void> {
    }

    protected async getDependedService<T extends Service>(name: string): Promise<T> {
        if (this.dependencies[name] != null) {
            let result: Service = <Service>this.dependencies[name].instance;
            if (result instanceof ServiceResolver) {
                return <T>await result.resolve();
            }
            return <T>result;
        }
        return null;
    }
}

/**
 * A service which can be used in Kanro.
 *
 * @export
 * @abstract
 * @class Service
 * @extends {Node}
 */
export abstract class Service extends Node {
    readonly isProxable: boolean = true;

    constructor(container: INodeContainer<Service>) {
        super(container);
    }
}

export abstract class ServiceResolver extends Service {
    readonly isProxable: boolean = false;

    abstract async resolve(): Promise<Service>;

    constructor(container: INodeContainer<Service>) {
        super(container);
    }
}