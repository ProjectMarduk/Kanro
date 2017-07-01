import { Responder, INodeContainer } from "../Core";
import { File } from "../IO";
import { IRequest, IResponse, JsonResponseBody, Request, FileResponseBody } from "../Http";
import { NotFoundException } from "../Exceptions";
import { KanroManager } from "..";

export interface FileRendererContainer extends INodeContainer<FileRenderer> {
    resource: string;
}

export class FileRenderer extends Responder {
    async respond(request: IRequest): Promise<IResponse> {
        let response = request.respond();
        let path = `${this.resource}/${request.relativeUrl}`;

        if (await File.exists(path)) {
            response.body = new FileResponseBody(path);
            return response;
        }

        throw new NotFoundException();
    }

    dependencies = { KanroManager: { name: "kanro", version: "*" } };
    response: any;
    resource: string;

    constructor(config: FileRendererContainer) {
        super(config);
        if (config.resource != undefined) {
            if ((<string>config.resource).startsWith(".")) {
                this.resource = `${process.cwd()}/${config.resource}`;
            } else {
                this.resource = config.resource;
            }
        }
    }

    async onDependenciesFilled() {
        if(this.resource == undefined){
            this.resource = (<KanroManager><any>this.dependencies.KanroManager).getKanroConfig('resource');
        }

        if(this.resource == undefined){
            this.resource = process.cwd();
        }
    }
}