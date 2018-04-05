import { File } from "../IO";
import { FileResponseBody, IRequest, IResponse, JsonResponseBody, Request } from "../Http";
import { IModuleInfo, INodeContainer, Responder } from "../Core";
import { KanroManager } from "..";
import { KanroModule } from "../KanroModule";
import { NotFoundException } from "../Exceptions";

export interface IFileRendererContainer extends INodeContainer<FileRenderer> {
    resource: string;
}

export class FileRenderer extends Responder {
    async respond(request: IRequest): Promise<IResponse> {
        let response: IResponse = request.respond();
        let path: string = `${this.resource}/${request.relativeUrl}`;

        if (await File.exists(path)) {
            response.body = new FileResponseBody(path);
            return response;
        }

        throw new NotFoundException();
    }

    dependencies = { kanroManager: { name: KanroManager.name, module: KanroModule.moduleInfo } };
    resource: string;

    constructor(config: IFileRendererContainer) {
        super(config);
        if (config.resource != null) {
            if ((<string>config.resource).startsWith(".")) {
                this.resource = `${process.cwd()}/${config.resource}`;
            } else {
                this.resource = config.resource;
            }
        }
    }

    async onLoaded(): Promise<void> {
        if (this.resource == null) {
            this.resource = await (await this.getDependedService<KanroManager>("kanroManager")).getKanroConfig("resource");
        }

        if (this.resource == null) {
            this.resource = process.cwd();
        }
    }
}