import { Responder, INodeContainer } from "../Core";
import { IRequest, IResponse, JsonResponseBody } from "../Http";
import { StringResponseBody } from "../Http/StringResponseBody";

export interface IJsonRendererContainer extends INodeContainer<JsonRenderer> {
    response: Object;
}

export class JsonRenderer extends Responder {
    async respond(request: IRequest): Promise<IResponse> {
        let response: IResponse = request.respond();
        response.status = 200;
        response.body = new JsonResponseBody(this.response);
        return response;
    }

    response: any;

    constructor(config: IJsonRendererContainer) {
        super(config);
        if (config.response != null) {
            this.response = config.response;
        } else {
            this.response = { code: 0, message: "normal" };
        }
    }
}