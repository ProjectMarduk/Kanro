import * as Cluster from "cluster";
import { NodeHandler } from "../NodeHandler";
import { Application } from "../Application";
import { HttpServer } from "../HttpServer";
import { IAppConfig } from "../IAppConfig";
import { ModuleManager } from "../ModuleManager";
import { ObjectUtils } from "../Utils/index";
import { KanroModule } from "../KanroModule";
import { Module } from "../Core/index";
import { ILogger } from "../Logging";

export class Worker {
    constructor(application: Application, clusterLogger: ILogger, appLogger: ILogger) {
        this.application = application;
        this.clusterLogger = clusterLogger;
        this.appLogger = appLogger;
    }

    private application: Application;
    private clusterLogger: ILogger;
    private appLogger: ILogger;

    async run() {
        process.on('message', data => {
            this.messageReceived(data);
        });
        process.send({ type: 'online' });
    }

    private messageReceived(message: any) {
        switch (message['type']) {
            case 'config':
                this.application.reloadConfigs(message['config']);
                break;
            default:
                break;
        }
    }
}