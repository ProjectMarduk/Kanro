import { Application } from "./Application";
import { ConfigBuilder } from "./ConfigBuilder";
import { HttpServer } from "./HttpServer";
import { IModuleInfo, INodeContainer, Module, Node } from "./Core";
import { LoggerManager } from "./LoggerManager";
import { ModuleManager } from "./ModuleManager";
import { NpmClient } from "./NpmClient";

export class KanroInternalModule extends Module {
    application: Application;
    npmClient: NpmClient;
    moduleManager: ModuleManager;
    loggerManager: LoggerManager;
    configBuilder: ConfigBuilder;
    httpServer: HttpServer;

    constructor(application: Application) {
        super();
        this.application = application;
        this.npmClient = new NpmClient();
        this.moduleManager = new ModuleManager();
        this.loggerManager = new LoggerManager();
        this.configBuilder = new ConfigBuilder();
        this.httpServer = new HttpServer();
    }

    get nodes(): Array<string> {
        return [
            Application.name,
            NpmClient.name,
            HttpServer.name,
            ModuleManager.name,
            LoggerManager.name,
            ConfigBuilder.name,
        ];
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
    };
}