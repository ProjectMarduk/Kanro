import * as Http from "http";

/**
 * Body of HTTP response.
 *
 * @export
 * @interface IResponseBody
 */
export interface IResponseBody {
    /**
     * Write data to response.
     *
     * @param {Web.ServerResponse} response
     * @returns {Promise<any>}
     *
     * @memberOf IResponseBody
     */
    write(response: Http.ServerResponse): Promise<any>;
}