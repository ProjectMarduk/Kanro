import { Responder, INodeContainer, IModuleInfo } from "../Core";
import { File } from "../IO";
import { IRequest, IResponse, JsonResponseBody, Request, FileResponseBody } from "../Http";
import { NotFoundException } from "../Exceptions";
import { KanroManager } from "..";
import { KanroModule } from "../KanroModule";

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

    dependencies = { kanroManager: { name: KanroManager.name, module: KanroModule.moduleInfo } };
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

    async onLoaded() {
        if(this.resource == undefined){
            this.resource = this.getDependedService<KanroManager>("kanroManager").getKanroConfig('resource');
        }

        if(this.resource == undefined){
            this.resource = process.cwd();
        }
    }
}