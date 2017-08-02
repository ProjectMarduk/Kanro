import * as Http from "http";
import * as Cluster from "cluster";
import * as OS from "os";

import { RequestMirror, Request, Response } from "./Http";
import { NotFoundException, NonstandardNodeException, NodeNotSupportedException } from "./Exceptions";
import { UnexpectedNodeException } from "./Exceptions/UnexpectedNodeException";
import { LoggerManager } from "./LoggerManager";
import { ModuleManager } from "./ModuleManager";
import { INodeContainer, Node, RequestHandler, RequestDiverter, RequestReplicator, Responder, ResponseHandler, ExceptionHandler, Fuse, Module } from "./Core";
import { IAppConfig } from "./IAppConfig";
import { Colors, Style, AnsiStyle, LogLevel, Logger } from "./Logging";
import { ConfigBuilder } from "./ConfigBuilder";
import { KanroModule } from "./KanroModule";
import { AppLogger } from "./AppLogger";
import { Master } from "./Cluster/Master";
import { Worker } from "./Cluster/Worker";

let clusterLogger = LoggerManager.current.registerLogger("Cluster", AnsiStyle.create().foreground(Colors.cyan));

export enum HttpMethod {
    get = Colors.green,
    post = Colors.blue,
    put = Colors.cyan,
    delete = Colors.red,
    patch = Colors.yellow
}

export class Application {
    private httpServer: Http.Server;

    public die(error: Error, module: String) {
        let stackInfo = error.stack;

        while (error['innerException'] != undefined) {
            error = error['innerException'];
            stackInfo += `\n With inner exception '${error.name}'\n    ${error.stack}`;
        }

        AppLogger.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${stackInfo}`)
        process.exit(-1);
    }

    private helloKanro() {
        console.log("");
        console.log("");
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888     ,88'          .8.          b.             8 8 888888888o.      ,o888888o.     "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888    ,88'          .888.         888o.          8 8 8888    `88.  . 8888     `88.   "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888   ,88'          :88888.        Y88888o.       8 8 8888     `88 ,8 8888       `8b  "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888  ,88'          . `88888.       .`Y888888o.    8 8 8888     ,88 88 8888        `8b "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888 ,88'          .8. `88888.      8o. `Y888888o. 8 8 8888.   ,88' 88 8888         88 "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888 88'          .8`8. `88888.     8`Y8o. `Y88888o8 8 888888888P'  88 8888         88 "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 888888<          .8' `8. `88888.    8   `Y8o. `Y8888 8 8888`8b      88 8888        ,8P "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888 `Y8.       .8'   `8. `88888.   8      `Y8o. `Y8 8 8888 `8b.    `8 8888       ,8P  "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888   `Y8.    .888888888. `88888.  8         `Y8o.` 8 8888   `8b.   ` 8888     ,88'   "}`);
        console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${"    8 8888     `Y8. .8'       `8. `88888. 8            `Yo 8 8888     `88.    `8888888P'     "}`);
        console.log("");
        console.log("");
    }

    async run(config?: IAppConfig, localModules: { module: Module, name: string, version: string }[] = []) {
        try {
            localModules.push({ name: "kanro", version: "*", module: new KanroModule() });
            
            if (Cluster.isMaster) {
                this.helloKanro();
                AppLogger.info("Booting...");

                AppLogger.info("Create application context...");
                await ConfigBuilder.initialize();

                if (config == undefined) {
                    config = await ConfigBuilder.readConfig(config);
                }

                await Master.current.run(config, localModules);
            }
            else {
                await Worker.current.run(config, localModules);
            }

        } catch (error) {
            this.die(error, "App");
        }
    }

    async reloadConfigs(config?: IAppConfig) {
        try {
            if (Cluster.isMaster) {
                AppLogger.info("Reload configs...");

                AppLogger.info("Create application context...");
                if (config == undefined) {
                    config = await ConfigBuilder.readConfig();
                }

                await Master.current.reloadConfig(config);
            }
            else {
                if (config == undefined) {
                    config = await ConfigBuilder.readConfig();
                }
                process.send({ type: 'config', config: config });
            }
        } catch (error) {
            AppLogger.error(`An exception occurred in reload config, operation have been cancelled, message: '${error.message}'`);
        }
    }

    public get config(): Readonly<IAppConfig> {
        if (Cluster.isMaster) {
            return Master.current.config;
        }
        return Worker.current.config;
    }

    private constructor() {
    }

    private static instance: Application;

    static get current(): Application {
        if (Application.instance == undefined) {
            Application.instance = new Application();
        }
        return Application.instance;
    }
}