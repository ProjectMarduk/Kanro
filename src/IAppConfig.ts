import { IModuleInfo, INodeContainer, RequestDiverter, RequestHandler, RequestReplicator, ResponseHandler, Service } from "./Core";

/**
 * Config of Kanro APP.
 *
 * @export
 * @interface IAppConfig
 */
export interface IAppConfig {

    /**
     * The port what Kanro HTTP server will listen.
     *
     * @type {number}
     * @memberOf IAppConfig
     */
    port: number;

    /**
     * The NPM registry what module manager will used.
     *
     * @type {string}
     * @memberOf IAppConfig
     */
    registry?: string;

    /**
     * The static resource dir of app.
     *
     * @type {string}
     * @memberOf IAppConfig
     */
    resource?: string;

    cluster?: boolean;

    rabbitMq?: string;

    /**
     * The http request entry point.
     *
     * @type {(INodeContainer<RequestHandler | RequestDiverter | RequestReplicator>)}
     * @memberof IAppConfig
     */
    entryPoint: INodeContainer<RequestHandler | RequestDiverter | RequestReplicator>;

    /**
     * The http response exit point.
     *
     * @type {INodeContainer<ResponseHandler>}
     * @memberof IAppConfig
     */
    exitPoint?: INodeContainer<ResponseHandler>;
}