import { Application } from "./Application";
import { FileRenderer, HttpExceptionRenderer, JsonRenderer } from "./Primitives";
import { IModuleInfo, INodeContainer, Module, Node } from "./Core";
import { KanroManager } from "./KanroManager";
import { MethodRouter, UrlRouter } from "./Router";
import { RemoteServiceContainer, RemoteServiceHolder } from "./Remoting";

export class KanroModule extends Module {
    readonly nodes: Array<string> =
        [
            FileRenderer.name,
            HttpExceptionRenderer.name,
            JsonRenderer.name,
            UrlRouter.name,
            MethodRouter.name,
            KanroManager.name,
            RemoteServiceHolder.name,
            RemoteServiceContainer.name,
        ];


    async getNode(container: INodeContainer<Node>): Promise<Node> {
        switch (container.name) {
            case FileRenderer.name:
                return new FileRenderer(<any>container);
            case HttpExceptionRenderer.name:
                return new HttpExceptionRenderer(<any>container);
            case JsonRenderer.name:
                return new JsonRenderer(<any>container);
            case UrlRouter.name:
                return new UrlRouter(<any>container);
            case MethodRouter.name:
                return new MethodRouter(<any>container);
            case KanroManager.name:
                return new KanroManager(<any>container);
            case RemoteServiceHolder.name:
                return new RemoteServiceHolder(<any>container);
            case RemoteServiceContainer.name:
                return new RemoteServiceContainer(<any>container);
            default:
                return undefined;
        }
    }

    static moduleInfo: IModuleInfo = {
        name: "kanro",
        version: "*"
    };
}