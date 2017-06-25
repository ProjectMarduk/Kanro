import { IRequestHandlerContainer, IRequestDiverterContainer, IRequestReplicatorContainer, IResponderContainer, IGlobalExceptionHandlerContainer, IGlobalRequestHandlerContainer, IGlobalResponseHandlerContainer } from "../Containers";

export interface IExecutorsConfig {
    /**
     * The entry point of the links.
     * 
     * @type {(IRequestHandlerConfig | IRequestDiverterConfig | IRequestReplicatorConfig | IResponderConfig)}
     * @memberOf IExecutorsConfig
     */
    entryPoint: IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer;
    /**
     * Global exception handler, if some uncaught exception be threw in links, the global exception handler will handle it.
     * 
     * @type {IGlobalExceptionHandlerConfig[]}
     * @memberOf IExecutorsConfig
     */
    globalExceptionHandlers: IGlobalExceptionHandlerContainer[];
    /**
     * Global request handler, all request will be handled with it.
     * 
     * @type {IGlobalRequestHandlerConfig}
     * @memberOf IExecutorsConfig
     */
    globalRequestHandler: IGlobalRequestHandlerContainer;
    /**
     * Global response handler, all response will be handled with it.
     * 
     * @type {IGlobalResponseHandlerConfig}
     * @memberOf IExecutorsConfig
     */
    globalResponseHandler: IGlobalResponseHandlerContainer;
}