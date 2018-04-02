import * as Http from "http";
import * as Cluster from "cluster";
import * as OS from "os";

import { RequestMirror, Request, Response, RequestContext } from "./Http";
import { NotFoundException, NonstandardNodeException, NodeNotSupportedException } from "./Exceptions";
import { UnexpectedNodeException } from "./Exceptions/UnexpectedNodeException";
import { LoggerManager } from "./LoggerManager";
import { ModuleManager } from "./ModuleManager";
import { IModuleInfo, INodeContainer, Node, RequestHandler, RequestDiverter, RequestReplicator, Responder, ResponseHandler, ExceptionHandler, Fuse, Module, Service } from "./Core";
import { IAppConfig } from "./IAppConfig";
import { Colors, Style, AnsiStyle, LogLevel, Logger, ILogger } from "./Logging";
import { ConfigBuilder } from "./ConfigBuilder";
import { KanroModule } from "./KanroModule";
import { Master } from "./Cluster/Master";
import { Worker } from "./Cluster/Worker";
import { KanroInternalModule } from "./KanroInternalModule";
import { version } from "punycode";
import { ObjectUtils } from "./Utils";
import { HttpServer } from "./HttpServer";
import { NodeHandler } from "./NodeHandler";
import { NpmClient } from "./NpmClient";

export enum HttpMethod {
    get = Colors.green,
    post = Colors.blue,
    put = Colors.cyan,
    delete = Colors.red,
    patch = Colors.yellow
}

export class Application extends Service {
    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        },
        configBuilder: {
            name: ConfigBuilder.name,
            module: KanroInternalModule.moduleInfo
        },
        moduleManager: {
            name: ModuleManager.name,
            module: KanroInternalModule.moduleInfo
        },
        httpServer: {
            name: HttpServer.name,
            module: KanroInternalModule.moduleInfo
        },
        npmClient: {
            name: NpmClient.name,
            module: KanroInternalModule.moduleInfo
        }
    }

    constructor(config?: IAppConfig, localModules: { module: Module, name: string, version: string }[] = []) {
        super(undefined);
        this.configMeta = config;
        this.localModules = localModules;
    }

    private isBooted: boolean = false;
    private configMeta: IAppConfig;
    private runtimeContext: IAppConfig;
    private localModules: { module: Module, name: string, version: string }[];
    private get configBuilder(): ConfigBuilder {
        return this.getDependedService<ConfigBuilder>("configBuilder");
    }
    private get moduleManager(): ModuleManager {
        return this.getDependedService<ModuleManager>("moduleManager");
    }
    private get npmClient(): NpmClient {
        return this.getDependedService<NpmClient>("npmClient");
    }
    private get httpServer(): HttpServer {
        return this.getDependedService<HttpServer>("httpServer");
    }

    async onLoaded(): Promise<void> {
        this.appLogger = this.getDependedService<LoggerManager>("loggerManager").registerLogger("App", AnsiStyle.create().foreground(Colors.magenta));
        this.clusterLogger = this.getDependedService<LoggerManager>("loggerManager").registerLogger("Cluster", AnsiStyle.create().foreground(Colors.cyan));
    }
    private appLogger: ILogger;
    private clusterLogger: ILogger;

    public die(error: Error, module: String) {
        let stackInfo = error.stack;

        while (error['innerException'] != undefined) {
            error = error['innerException'];
            stackInfo += `\n With inner exception '${error.name}'\n    ${error.stack}`;
        }

        this.appLogger.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${stackInfo}`)
        process.exit(-1);
    }

    public get isProxable() {
        return false;
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

    async run() {
        try {
            await this.boot();
        } catch (error) {
            this.die(error, "App");
        }
    }

    async reloadConfigs(config?: IAppConfig): Promise<Application> {
        if (!this.isBooted) {
            await this.workerBoot(config);
            return this;
        }

        try {
            if (Cluster.isMaster) {
                this.appLogger.info("Rebuild application context...");
            }

            let newApp = new Application(config, this.localModules);
            await newApp.boot(this);
            return newApp;
        } catch (error) {
            this.appLogger.error(`An exception occurred in reload config, operation have been cancelled, message: '${error.message}'`);
        }
    }

    public get config(): Readonly<IAppConfig> {
        return this.configMeta;
    }

    private async initializeInternalModule() {
        let internalModule = new KanroInternalModule(this);
        await internalModule.moduleManager.initialize(internalModule);
        await internalModule.configBuilder.initialize();
    }

    private registerLocalModules(localModules: { module: Module, name: string, version: string }[] = []) {
        for (const localModule of localModules) {
            this.moduleManager.registerLocalModule(localModule.name, localModule.version, localModule.module)
        }
    }

    private async entryPointe(context: RequestContext) {
        context = await NodeHandler(context, this.runtimeContext.entryPoint);
        context = await NodeHandler(context, this.runtimeContext.exitPoint);
        return context;
    }

    private async boot(application?: Application) {
        if (Cluster.isMaster) {
            if(application == undefined){
                this.helloKanro();
            }
            this.isBooted = true;
            await this.initializeInternalModule();
            this.appLogger.info("Booting...");

            this.appLogger.info("Load application config...");
            this.configMeta = await this.configBuilder.readConfig(this.configMeta);
            this.runtimeContext = ObjectUtils.copy(this.config);

            if (this.config.cluster) {
                this.appLogger.info("Register local modules...");
                this.registerLocalModules(this.localModules);

                this.appLogger.info("Install module and fill nodes...");
                await this.moduleManager.loadConfig(this.runtimeContext);

                await (new Master(this, this.clusterLogger, this.appLogger)).run();
                this.appLogger.info("Kanro is ready.");
            }
            else {
                this.appLogger.info("Register local modules...");
                this.registerLocalModules(this.localModules);

                this.appLogger.info("Install module and fill nodes...");
                await this.moduleManager.loadConfig(this.runtimeContext);

                let oldHttpServer = ObjectUtils.getValueFormKeys(application, "httpServer");
                await this.httpServer.initialize(this.config.port, async (context) => {
                    return await this.entryPointe(context)
                }, oldHttpServer);

                this.appLogger.info("Kanro is ready.");
            }
        }
        else {
            await this.initializeInternalModule();
            this.appLogger.info("Booting worker...");
            await (new Worker(this, this.clusterLogger, this.appLogger)).run();
        }
    }

    async workerBoot(config: IAppConfig) {
        this.isBooted = true;
        this.configMeta = await this.configBuilder.readConfig(config);
        this.runtimeContext = ObjectUtils.copy(this.config);
        this.registerLocalModules(this.localModules);
        await this.moduleManager.loadConfig(this.runtimeContext);
        await this.httpServer.initialize(this.config.port, async (context) => {
            return await this.entryPointe(context)
        });
        this.appLogger.info(`Worker ${Cluster.worker.id} is ready.`);
    }
}