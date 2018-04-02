import * as Cluster from "cluster";
import * as OS from "os";
import { LoggerManager } from "../LoggerManager";
import { AnsiStyle, Colors, ILogger, LogLevel } from "../Logging/index";
import { ConfigBuilder } from "../ConfigBuilder";
import { IAppConfig } from "../IAppConfig";
import { NodeHandler } from "../NodeHandler";
import { ObjectUtils, LoggerUtils, TimeUtils } from "../Utils/index";
import { ModuleManager } from "../ModuleManager";
import { KanroModule } from "../KanroModule";
import { Application } from "../Application";
import { CoreLogger } from "../Logging/CoreLogger";
import { Worker } from "./Worker";
import { Module } from "../Core/index";

export class Master {
    constructor(application: Application, clusterLogger: ILogger, appLogger: ILogger) {
        this.application = application;
        this.clusterLogger = clusterLogger;
        this.appLogger = appLogger;
    }

    private application: Application;
    private clusterLogger: ILogger;
    private appLogger: ILogger;
    private workLogger: { [id: string]: Colors } = {};

    async run() {
        let color = 0;

        this.clusterLogger.info("Running with cluster mode, forking workers.");

        let workerCount = OS.cpus().length - Object.keys(Cluster.workers).length;
        for (var i = 0; i < workerCount; i++) {
            Cluster.fork();
        }

        Cluster.on("exit", function (worker, code, signal) {
            if(this.workLogger[worker.id] != undefined){

                this.workLogger[worker.id] = undefined;
                this.clusterLogger.warning(`Worker(${worker.id}) has exited, creating new worker.`);
                Cluster.fork();
            }
        });

        Cluster.on('fork', worker => {
            this.workLogger[worker.id] = ++color;
            if (color >= 7) {
                color = 0;
            }
        });

        Cluster.on('message', (worker, message: { type: string }, handle) => {
            switch (message.type) {
                case 'online':
                    worker.send({ type: 'config', config: this.application.config });
                    break;
                case 'log':
                    switch (<LogLevel>message['level']) {
                        case LogLevel.info:
                            CoreLogger.current.log(LoggerUtils.buildLogString(message['namespace'], LogLevel.info, message['message'], TimeUtils.getTimePassed(CoreLogger.time), AnsiStyle.create(message['style'])));
                            break;
                        case LogLevel.success:
                            CoreLogger.current.log(LoggerUtils.buildLogString(message['namespace'], LogLevel.success, message['message'], TimeUtils.getTimePassed(CoreLogger.time), AnsiStyle.create(message['style'])));
                            break;
                        case LogLevel.warning:
                            CoreLogger.current.error(LoggerUtils.buildLogString(message['namespace'], LogLevel.warning, message['message'], TimeUtils.getTimePassed(CoreLogger.time), AnsiStyle.create(message['style'])));
                            break;
                        case LogLevel.error:
                            CoreLogger.current.error(LoggerUtils.buildLogString(message['namespace'], LogLevel.error, message['message'], TimeUtils.getTimePassed(CoreLogger.time), AnsiStyle.create(message['style'])));
                            break;
                    }
                    break;
                case 'config':
                    this.application.reloadConfigs(message['config']);
                    break;
                default:
                    break;
            }
        });
    }

    async reloadConfig(config: IAppConfig) {
        for (let id in Cluster.workers) {
            Cluster.workers[id].send({ type: 'config', config: config });
        }
    }
}