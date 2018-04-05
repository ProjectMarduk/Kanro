import * as Cluster from "cluster";
import { Application } from "../Application";
import { HttpServer } from "../HttpServer";
import { IAppConfig } from "../IAppConfig";
import { ILogger } from "../Logging";
import { KanroModule } from "../KanroModule";
import { Module } from "../Core/index";
import { ModuleManager } from "../ModuleManager";
import { NodeHandler } from "../NodeHandler";
import { ObjectUtils } from "../Utils/index";
import { IMessage, IConfigMessage } from "./Message";

export class Worker {
    constructor(application: Application, clusterLogger: ILogger, appLogger: ILogger) {
        this.application = application;
        this.clusterLogger = clusterLogger;
        this.appLogger = appLogger;
    }

    private application: Application;
    private clusterLogger: ILogger;
    private appLogger: ILogger;

    async run(): Promise<void> {
        process.on("message", data => {
            this.messageReceived(data);
        });
        process.send({ type: "online" });
    }

    private messageReceived(message: IMessage): void {
        switch (message.type) {
            case "config":
                let configMessage: IConfigMessage = <IConfigMessage>message;
                this.application.reloadConfigs(configMessage.config);
                break;
            default:
                break;
        }
    }
}