import * as Cluster from "cluster";
import { RequestContext } from "../RequestContext";
import { NodeHandler } from "../NodeHandler";
import { Application } from "../Application";
import { HttpServer } from "../HttpServer";
import { IAppConfig } from "../IAppConfig";
import { AppLogger } from "../AppLogger";
import { ModuleManager } from "../ModuleManager";
import { ObjectUtils } from "../Utils/index";
import { KanroModule } from "../KanroModule";
import { Module } from "../Core/index";

export class Worker {
    private constructor() {
    }

    private configMeta: IAppConfig;
    private appConfig: IAppConfig;
    private server: HttpServer;
    private static instance: Worker;
    private localModules: { module: Module, name: string, version: string }[];

    static get current(): Worker {
        if (Worker.instance == undefined) {
            Worker.instance = new Worker();
        }
        return Worker.instance;
    }

    get config(): Readonly<IAppConfig> {
        return this.configMeta;
    }

    async run(config: IAppConfig, localModules: { module: Module, name: string, version: string }[]) {
        if (Cluster.isWorker) {
            process.on('message', data => {
                this.messageReceived(data);
            });
            process.send({ type: 'online' });
        }
        else {
            await this.initialize(config);
        }
    }

    async initialize(config: IAppConfig) {
        this.configMeta = ObjectUtils.copy(config);
        this.appConfig = config;

        if (ModuleManager.current == undefined) {
            await ModuleManager.initialize(config);
            ModuleManager.current.registerLocalModule('kanro', '*', new KanroModule());
            
            await ModuleManager.current.loadConfig(config);
        }
        else {
            await ModuleManager.current.reloadConfig(config);
        }

        if (this.server == undefined) {
            await HttpServer.initialize(config.port, async r => {
                return await this.entryPointe(r);
            });
        }

        if (Cluster.isWorker) {
            AppLogger.success(`Worker(${Cluster.worker.id}) is ready.`);
        }
        else {
            AppLogger.success('Kanro is ready.');
        }
    }

    private async entryPointe(context: RequestContext) {
        let config = this.appConfig;
        context = await NodeHandler(context, config.entryPoint);
        context = await NodeHandler(context, config.exitPoint);
        return context;
    }

    private messageReceived(message: any) {
        switch (message['type']) {
            case 'config':
                this.initialize(message['config']);
                break;
            default:
                break;
        }
    }
}