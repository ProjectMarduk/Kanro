import * as Cluster from "cluster";
import * as Http from "http";
import * as OS from "os";
import { AnsiStyle, Colors, ILogger, Logger, LogLevel, Style } from "./Logging";
import { ConfigBuilder } from "./ConfigBuilder";
import {
    ExceptionHandler,
    Fuse,
    IModuleInfo,
    INodeContainer,
    Module,
    Node,
    RequestDiverter,
    RequestHandler,
    RequestReplicator,
    Responder,
    ResponseHandler,
    Service
} from "./Core";
import { File, Path } from "./IO";
import { HttpServer } from "./HttpServer";
import { IAppConfig } from "./IAppConfig";
import { KanroInternalModule } from "./KanroInternalModule";
import { KanroModule } from "./KanroModule";
import { LoggerManager } from "./LoggerManager";
import { Master } from "./Cluster/Master";
import { ModuleManager } from "./ModuleManager";
import { NodeHandler } from "./NodeHandler";
import { NodeNotSupportedException, NonstandardNodeException, NotFoundException } from "./Exceptions";
import { NpmClient } from "./NpmClient";
import { ObjectUtils } from "./Utils";
import { Request, RequestContext, RequestMirror, Response } from "./Http";
import { UnexpectedNodeException } from "./Exceptions/UnexpectedNodeException";
import { version } from "punycode";
import { Worker } from "./Cluster/Worker";


let projectDir: string = Path.resolve(__dirname, "..");

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
    };

    constructor(config?: IAppConfig, localModules: { module: Module, name: string, version: string }[] = []) {
        super(undefined);
        this.configMeta = config;
        this.localModules = localModules;
    }

    private isBooted: boolean = false;
    private configMeta: IAppConfig;
    private runtimeContext: IAppConfig;
    private localModules: { module: Module, name: string, version: string }[];
    private configBuilder: ConfigBuilder;
    private moduleManager: ModuleManager;
    private npmClient: NpmClient;
    private httpServer: HttpServer;

    async onLoaded(): Promise<void> {
        this.configBuilder = await this.getDependedService<ConfigBuilder>("configBuilder");
        this.moduleManager = await this.getDependedService<ModuleManager>("moduleManager");
        this.npmClient = await this.getDependedService<NpmClient>("npmClient");
        this.httpServer = await this.getDependedService<HttpServer>("httpServer");

        this.appLogger = await (await this.getDependedService<LoggerManager>("loggerManager"))
            .registerLogger("App", AnsiStyle.create().foreground(Colors.magenta));
        this.clusterLogger = await (await this.getDependedService<LoggerManager>("loggerManager"))
            .registerLogger("Cluster", AnsiStyle.create().foreground(Colors.cyan));
    }
    private appLogger: ILogger;
    private clusterLogger: ILogger;

    die(error: Error, module: String): void {
        let stackInfo: string = error.stack;

        while (error.hasOwnProperty("innerException")) {
            // tslint:disable-next-line:no-string-literal
            error = error["innerException"];
            stackInfo += `\n With inner exception '${error.name}'\n    ${error.stack}`;
        }

        this.appLogger.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${stackInfo}`);
        process.exit(-1);
    }

    readonly isProxable: boolean = false;

    private async helloKanro(): Promise<void> {
        let bannerFile: string = `${projectDir}/config/banner`;
        if (await File.exists(`${process.cwd()}/banner`)) {
            bannerFile = `${process.cwd()}/banner`;
        }

        let banner: string[] = (await File.readFile(bannerFile)).toString().replace("\r\n", "\n").replace("\r", "\n").split("\n");
        for (const line of banner) {
            console.log(Style`${AnsiStyle.create().foreground(Colors.blue)}${line}`);
        }
    }

    async run(): Promise<void> {
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

            let newApp: Application = new Application(config, this.localModules);
            await newApp.boot(this);
            return newApp;
        } catch (error) {
            this.appLogger.error(`An exception occurred in reload config, operation have been cancelled, message: '${error.message}'`);
        }
    }

    get config(): Readonly<IAppConfig> {
        return this.configMeta;
    }

    private async initializeInternalModule(): Promise<void> {
        let internalModule: KanroInternalModule = new KanroInternalModule(this);
        await internalModule.moduleManager.initialize(internalModule);
        await internalModule.configBuilder.initialize();
    }

    private registerLocalModules(localModules: { module: Module, name: string, version: string }[] = []): void {
        for (const localModule of localModules) {
            this.moduleManager.registerLocalModule(localModule.name, localModule.version, localModule.module);
        }
    }

    private async entryPoint(context: RequestContext): Promise<RequestContext> {
        context = await NodeHandler(context, this.runtimeContext.entryPoint);
        context = await NodeHandler(context, this.runtimeContext.exitPoint);
        return context;
    }

    private async boot(application?: Application): Promise<void> {
        if (Cluster.isMaster) {
            if (application == null) {
                await this.helloKanro();
            }
            this.isBooted = true;
            await this.initializeInternalModule();
            this.appLogger.info("Booting...");

            this.appLogger.info("Load application config...");
            this.configMeta = await this.configBuilder.readConfig(this.configMeta);
            this.runtimeContext = ObjectUtils.copy(this.config);

            this.appLogger.info("Register local modules...");
            this.registerLocalModules(this.localModules);

            this.appLogger.info("Install modules and fill nodes...");
            await this.moduleManager.loadConfig(this.runtimeContext);

            if (this.config.cluster) {
                this.appLogger.warning("Cluster mode is experimental in current kanro version, some feature may be instability.");
                await (new Master(this, this.clusterLogger, this.appLogger)).run();
                this.appLogger.info("Kanro is ready.");
            } else {
                let oldHttpServer: HttpServer = ObjectUtils.getValueFormKeys(application, "httpServer");
                await this.httpServer.initialize(this.config.port, async (context) => {
                    return await this.entryPoint(context);
                }, oldHttpServer);

                this.appLogger.info("Kanro is ready.");
            }
        } else {
            await this.initializeInternalModule();
            this.appLogger.info("Booting worker...");
            await (new Worker(this, this.clusterLogger, this.appLogger)).run();
        }
    }

    async workerBoot(config: IAppConfig): Promise<void> {
        this.isBooted = true;
        this.configMeta = await this.configBuilder.readConfig(config);
        this.runtimeContext = ObjectUtils.copy(this.config);
        this.registerLocalModules(this.localModules);
        await this.moduleManager.loadConfig(this.runtimeContext);
        await this.httpServer.initialize(this.config.port, async (context) => {
            return await this.entryPoint(context);
        });
        this.appLogger.info(`Worker ${Cluster.worker.id} is ready.`);
    }
}