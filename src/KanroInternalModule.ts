import { Module, INodeContainer, Node, IModuleInfo } from "./Core";
import { Application } from "./Application";
import { NpmClient } from "./NpmClient";
import { ModuleManager } from "./ModuleManager";
import { LoggerManager } from "./LoggerManager";
import { ConfigBuilder } from "./ConfigBuilder";
import { HttpServer } from "./HttpServer";

export class KanroInternalModule extends Module {
    application: Application;
    npmClient: NpmClient;
    moduleManager: ModuleManager;
    loggerManager: LoggerManager;
    configBuilder: ConfigBuilder;
    httpServer: HttpServer;

    constructor(application: Application) {
        super()
        this.application = application;
        this.npmClient = new NpmClient();
        this.moduleManager = new ModuleManager();
        this.loggerManager = new LoggerManager();
        this.configBuilder = new ConfigBuilder();
        this.httpServer = new HttpServer();
    }

    async getNode(container: INodeContainer<Node>): Promise<Node> {
        switch (container.name) {
            case Application.name:
                return this.application;
            case NpmClient.name:
                return this.npmClient;
            case HttpServer.name:
                return this.httpServer;
            case ModuleManager.name:
                return this.moduleManager;
            case LoggerManager.name:
                return this.loggerManager;
            case ConfigBuilder.name:
                return this.configBuilder;
            default:
                return undefined;
        }
    }

    static moduleInfo: IModuleInfo = {
        name: "kanro.internal",
        version: "*"
    }
}