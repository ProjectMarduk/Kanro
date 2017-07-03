import { IResponseBody } from "./IResponseBody";

import * as Http from "http";

/**
* String response body, it will return a object as json to client.
* 
* @export
* @class StringResponseBody
* @implements {IResponseBody}
*/
export class StringResponseBody implements IResponseBody {
    data: any;
    /**
     * Write string to response.
     * 
     * @param {Web.ServerResponse} response 
     * @returns {Promise<any>} 
     * 
     * @memberOf StringResponseBody
     */
    async write(response: Http.ServerResponse): Promise<any> {
        response.setHeader("Content-type", "text/html");
        await new Promise((res, rej) => {
            response.write(this.data, () => {
                res();
            })
        })
    }

    /**
     * Creates an instance of StringResponseBody.
     * @param {*} data Body object.
     * 
     * @memberOf StringResponseBody
     */
    constructor(data: any) {
        this.data = data;
    }
}