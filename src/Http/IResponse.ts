import * as Http from "http";
import { IHttpHeader } from "./IHttpHeader";
import { INodeContainer, Node } from "../Core";
import { IRequest } from "./IRequest";
import { IResponseBody } from "./IResponseBody";

/**
 * A HTTP response.
 *
 * @export
 * @interface IResponse
 */
export interface IResponse {
    /**
     * Meta data of response.
     *
     * @type {Web.ServerResponse}
     * @memberOf IResponse
     */
    meta: Http.ServerResponse;
    /**
     * Request information.
     *
     * @type {IRequest}
     * @memberOf IResponse
     */
    request: IRequest;
    /**
     * Header information of response.
     *
     * @type {IHttpHeader}
     * @memberOf IResponse
     */
    header: IHttpHeader;
    /**
     * Body of response.
     *
     * @type {IResponseBody}
     * @memberOf IResponse
     */
    body: IResponseBody;
    /**
     * Status code of response.
     *
     * @type {number}
     * @memberOf IResponse
     */
    status: number;
    /**
     * Nodes which have handled this request, it is very useful for debug, it will sync with 'request.traceStack'.
     *
     * @type {Config.INodeConfig[]}
     * @memberOf IResponse
     */
    traceStack: INodeContainer<Node>[];
}