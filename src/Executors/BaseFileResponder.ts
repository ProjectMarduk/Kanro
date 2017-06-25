import { IRequest, IResponse, Request, FileResponseBody } from "../Http";
import { IModuleInfo } from "../Core";
import { File } from "../IO";
import { IResponderContainer } from "../Containers";
import { NotFoundException } from "../Exceptions";
import { BaseExecutor } from "./BaseExecutor";
import { IResponder } from "./IResponder";
import { ExecutorType } from "./ExecutorType";

export class BaseFileResponder extends BaseExecutor implements IResponder {
    async respond(request: IRequest): Promise<IResponse> {
        let response = request.respond();
        let file = (<Request>request).routerKey.slice((<Request>request).routerIndex).join("/");
        let path = `${this.path}/${file}`;

        if (await File.exists(path)) {
            response.body = new FileResponseBody(path);
            return response;
        }

        throw new NotFoundException();
    }

    response: any;
    type: ExecutorType.Responder = ExecutorType.Responder;
    name: string = "BaseFileResponder";
    path: string;

    constructor(config: IResponderContainer) {
        super(config);
        if (config["path"] != undefined) {
            if ((<string>config["path"]).startsWith(".")) {
                this.path = `${process.cwd()}/${config["path"]}`;
            } else {
                this.path = config["path"];
            }
        } else {
            this.path = process.cwd();
        }
    }
}