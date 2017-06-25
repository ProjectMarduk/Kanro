import { IResponse, IRequest, JsonResponseBody } from "../Http";
import { IResponderContainer } from "../Containers";
import { BaseExecutor } from "./BaseExecutor";
import { IResponder } from "./IResponder";
import { ExecutorType } from "./ExecutorType";

export class BaseResponder extends BaseExecutor implements IResponder {
    async respond(request: IRequest): Promise<IResponse> {
        let response = request.respond();
        response.status = 200;
        response.body = new JsonResponseBody(this.response);
        return response;
    }

    response: any;
    type: ExecutorType.Responder = ExecutorType.Responder;
    name: string = "BaseResponder";

    constructor(config: IResponderContainer) {
        super(config);
        if (config["response"] != undefined) {
            this.response = config["response"];
        } else {
            this.response = { code: 0, message: "normal" };
        }
    }
}