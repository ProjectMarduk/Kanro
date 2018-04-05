import * as Http from "http";
import { IResponseBody } from "./IResponseBody";

/**
 * Json response body, it will return a object as json to client.
 *
 * @export
 * @class JsonResponseBody
 * @implements {IResponseBody}
 */
export class JsonResponseBody implements IResponseBody {
    data: any;
    /**
     * Write object as json to response.
     *
     * @param {Web.ServerResponse} response
     * @returns {Promise<any>}
     *
     * @memberOf JsonResponseBody
     */
    async write(response: Http.ServerResponse): Promise<any> {
        response.setHeader("Content-type", "application/json");
        await new Promise((res, rej) => {
            response.write(JSON.stringify(this.data), () => {
                res();
            });
        });
    }

    /**
     * Creates an instance of JsonResponseBody.
     * @param {*} data Body object.
     *
     * @memberOf JsonResponseBody
     */
    constructor(data: any) {
        this.data = data;
    }
}