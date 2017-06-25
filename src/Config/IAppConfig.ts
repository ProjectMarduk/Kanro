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
    resource: string;
}