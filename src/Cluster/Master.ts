import * as Cluster from "cluster";
import * as OS from "os";
import { AnsiStyle, Colors, ILogger, LogLevel } from "../Logging/index";
import { Application } from "../Application";
import { ConfigBuilder } from "../ConfigBuilder";
import { CoreLogger } from "../Logging/CoreLogger";
import { IAppConfig } from "../IAppConfig";
import { IConfigMessage, ILogMessage, IMessage } from "./Message";
import { KanroModule } from "../KanroModule";
import { LoggerManager } from "../LoggerManager";
import { LoggerUtils, ObjectUtils, TimeUtils } from "../Utils/index";
import { Module } from "../Core/index";
import { ModuleManager } from "../ModuleManager";
import { NodeHandler } from "../NodeHandler";
import { Worker } from "./Worker";

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

    async run(): Promise<void> {
        let color: number = 0;

        this.clusterLogger.info("Running with cluster mode, forking workers.");

        let workerCount: number = OS.cpus().length - Object.keys(Cluster.workers).length;
        for (let i: number = 0; i < workerCount; i++) {
            Cluster.fork();
        }

        Cluster.on("exit", function (worker: Cluster.Worker, code: number, signal: string): void {
            if (this.workLogger[worker.id] != null) {
                this.workLogger[worker.id] = undefined;
                this.clusterLogger.warning(`Worker(${worker.id}) has exited, creating new worker.`);
                Cluster.fork();
            }
        });

        Cluster.on("fork", worker => {
            this.workLogger[worker.id] = ++color;
            if (color >= 7) {
                color = 0;
            }
        });

        Cluster.on("message", (worker, message: IMessage, handle) => {
            switch (message.type) {
                case "online":
                    worker.send({ type: "config", config: this.application.config });
                    break;
                case "log":
                    let logMessage: ILogMessage = <ILogMessage>message;
                    switch (logMessage.level) {
                        case LogLevel.info:
                            CoreLogger.current.log(LoggerUtils.buildLogString(
                                logMessage.namespace,
                                LogLevel.info, logMessage.message,
                                TimeUtils.getTimePassed(CoreLogger.time),
                                AnsiStyle.create(logMessage.style)));
                            break;
                        case LogLevel.success:
                            CoreLogger.current.log(LoggerUtils.buildLogString(
                                logMessage.namespace,
                                LogLevel.success,
                                logMessage.message,
                                TimeUtils.getTimePassed(CoreLogger.time),
                                AnsiStyle.create(logMessage.style)));
                            break;
                        case LogLevel.warning:
                            CoreLogger.current.error(LoggerUtils.buildLogString(
                                logMessage.namespace,
                                LogLevel.warning,
                                logMessage.message,
                                TimeUtils.getTimePassed(CoreLogger.time),
                                AnsiStyle.create(logMessage.style)));
                            break;
                        case LogLevel.error:
                            CoreLogger.current.error(LoggerUtils.buildLogString(
                                logMessage.namespace,
                                LogLevel.error,
                                logMessage.message,
                                TimeUtils.getTimePassed(CoreLogger.time),
                                AnsiStyle.create(logMessage.style)));
                            break;
                    }
                    break;
                case "config":
                    let configMessage: IConfigMessage = <IConfigMessage>message;
                    this.application.reloadConfigs(configMessage.config);
                    break;
                default:
                    break;
            }
        });
    }

    async reloadConfig(config: IAppConfig): Promise<void> {
        for (let id in Cluster.workers) {
            if (Cluster.workers.hasOwnProperty(id)) {
                Cluster.workers[id].send({ type: "config", config: config });
            }
        }
    }
}