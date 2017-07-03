import { Module, INodeContainer, Node } from "./Core";
import { FileRenderer, HttpExceptionRenderer, JsonRenderer } from "./Primitives";
import { Router, MethodRouter } from "./Router";
import { KanroManager } from "./KanroManager";
import { Application } from "./Application";

export class KanroModule extends Module {

    async getNode(container: INodeContainer<Node>): Promise<Node> {
        switch (container.name) {
            case FileRenderer.name:
                return new FileRenderer(<any>container);
            case HttpExceptionRenderer.name:
                return new HttpExceptionRenderer(<any>container);
            case JsonRenderer.name:
                return new JsonRenderer(<any>container);
            case Router.name:
                return new Router(<any>container);
            case MethodRouter.name:
                return new MethodRouter(<any>container);
            case KanroManager.name:
                return new KanroManager();
            default:
                return undefined;
        }
    }
}