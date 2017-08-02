import * as Cluster from "cluster";
import * as OS from "os";
import { LoggerManager } from "../LoggerManager";
import { AnsiStyle, Colors, ILogger, LogLevel } from "../Logging/index";
import { ConfigBuilder } from "../ConfigBuilder";
import { IAppConfig } from "../IAppConfig";
import { RequestContext } from "../RequestContext";
import { NodeHandler } from "../NodeHandler";
import { ObjectUtils, LoggerUtils, TimeUtils } from "../Utils/index";
import { ModuleManager } from "../ModuleManager";
import { KanroModule } from "../KanroModule";
import { Application } from "../Application";
import { CoreLogger } from "../Logging/CoreLogger";
import { Worker } from "./Worker";
import { AppLogger } from "../AppLogger";
import { Module } from "../Core/index";

let clusterLogger = LoggerManager.current.registerLogger("Cluster", AnsiStyle.create().foreground(Colors.cyan));

export class Master {
    private constructor() {
    }

    private static instance: Master;
    private configMeta: IAppConfig;

    static get current(): Master {
        if (Master.instance == undefined) {
            Master.instance = new Master();
        }
        return Master.instance;
    }

    private createWorkers() {
        let workLogger: { [id: string]: Colors } = {};
        let color = 0;

        clusterLogger.info("Running with cluster mode, forking workers.");
        for (var i = 0; i < OS.cpus().length; i++) {
            Cluster.fork();
        }

        Cluster.on("exit", function (worker, code, signal) {
            workLogger[worker.id] = undefined;
            clusterLogger.warning(`Worker(${worker.id}) has exited, creating new worker.`);
            Cluster.fork();
        });

        Cluster.on('fork', worker => {
            workLogger[worker.id] = ++color;
            if (color >= 7) {
                color = 0;
            }
        });

        Cluster.on('message', (worker, message: { type: string }, handle) => {
            switch (message.type) {
                case 'online':
                    worker.send({ type: 'config', config: this.configMeta });
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
                    Application.current.reloadConfigs(message['config']);
                    break;
                default:
                    break;
            }
        });

        AppLogger.success("Kanro is ready.");
    }

    get config(): Readonly<IAppConfig> {
        return this.configMeta;
    }

    async run(config: IAppConfig, localModules: { module: Module, name: string, version: string }[] = []) {
        this.configMeta = ObjectUtils.copy(config);

        if (config.cluster != undefined && config.cluster) {
            AppLogger.info("Pre-initialize module manager...");
            await ModuleManager.initialize(config);
            for (let localModule of localModules) {
                ModuleManager.current.registerLocalModule(localModule.name, localModule.version, localModule.module);
            }
            AppLogger.info("Install module and fill nodes...");
            await ModuleManager.current.loadConfig(config);

            this.createWorkers();
            return;
        }
        else {
            AppLogger.info("Booting worker...");
            await Worker.current.run(config, localModules);
        }
    }

    async reloadConfig(config: IAppConfig) {
        let metaConfig = ObjectUtils.copy(config);

        if (this.config.cluster != undefined && this.config.cluster) {
            AppLogger.info("Pre-initialize module manager...");
            await ModuleManager.initialize(config);
            ModuleManager.current.registerLocalModule('kanro', '*', new KanroModule());

            AppLogger.info("Install module and fill nodes...");
            await ModuleManager.current.loadConfig(config);

            for (let id in Cluster.workers) {
                Cluster.workers[id].send({ type: 'config', config: metaConfig });
            }
        }
        else {
            await ModuleManager.current.reloadConfig(config);
            Worker.current.initialize(ObjectUtils.copy(metaConfig));
        }
        this.configMeta = metaConfig;
        return;
    }
}