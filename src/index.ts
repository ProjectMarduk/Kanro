import * as Web from "http";
import * as PathCore from "path";
import * as FileCore from "fs";
import * as Ajv from "Ajv";
import * as Debug from 'debug';
import * as Npm from 'npm';
import * as QueryString from "querystring";
import * as Url from "url";
import * as FileType from "file-type";
import * as MimeType from "mime-types";
import * as ReadChunk from "read-chunk";

export namespace Kanro {
    export const ModuleInfo: Core.IModuleInfo = { name: "kanro", version: "*" };

    export namespace Core {
        /**
         * Information of a Kanro module.
         * 
         * @export
         * @interface IModuleInfo
         */
        export interface IModuleInfo {
            /**
             * Name of this Kanro module.
             * 
             * @type {string}
             * @memberOf IModuleInfo
             */
            name: string;
            /**
             * Version of this Kanro module.
             * 
             * @type {string}
             * @memberOf IModuleInfo
             */
            version: string;
        }

        /**
         * A module which can be used in Kanro.
         * 
         * @export
         * @interface IModule
         */
        export interface IModule {
            /**
             * Information of this module included executors.
             * 
             * @type {{ [name: string]: Executors.IExecutorInfo }}
             * @memberOf IModule
             */
            executorInfos: { [name: string]: Executors.IExecutorInfo };
            /**
             * Dependent module, Kanro will install those module after install this module.
             * 
             * @type {IModuleInfo[]}
             * @memberOf IModule
             */
            dependencies: IModuleInfo[];
            /**
             * Get a executor by a executor config.
             * 
             * Note: Kanro 会对每个 executor config 调用这个方法，对于同样的名字的 executor 如果模块返回的是不同示例，则会导致在链路中也会使用不同的实例，反之如果对每个相同名字的 executor 都返回同一个实例，则会导致这个实例可能被用在多个链路上，如果你需要共享上下文则可以考虑这种方式。请根据具体的需求来返回单例。
             * 
             * @param {Config.IExecutorConfig} config 
             * @returns {Promise<Executors.IExecutor>} 
             * 
             * @memberOf IModule
             */
            getExecutor(config: Containers.IExecutorContainer): Promise<Executors.IExecutor>;
        }

        /**
         * Module manager is a service which is provided by Kanro, you can use this service to manage modules.
         * 
         * @export
         * @interface IModuleManager
         * @extends {IService}
         */
        export interface IModuleManager extends Executors.IService {
            /**
             * Install a module, if it have been installed, set reinstall to 'true' to reinstall it.
             * 
             * @param {string} name Name of module.
             * @param {string} version Version of module.
             * @param {boolean} [reinstall] Resinstall module.
             * @returns {Promise<IModule>} The module instance.
             * 
             * @memberOf IModuleManager
             */
            installModule(name: string, version: string, reinstall?: boolean): Promise<IModule>;
            /**
             * Check a module have been installed or not.
             * 
             * @param {string} name Name of module.
             * @param {string} version Version of module.
             * @returns {boolean} This module have been installed or not.
             * 
             * @memberOf IModuleManager
             */
            isModuleInstalled(name: string, version: string): boolean;
            /**
             * Get a installed module instance.
             * 
             * @param {string} name Name of module.
             * @param {string} version Version of module.
             * @returns {IModule} The module instance.
             * 
             * @memberOf IModuleManager
             */
            getModule(name: string, version: string): IModule;
            /**
             * Get a executor instance of a installed module.
             * 
             * @param {Config.IExecutorConfig} config Executor config.
             * @returns {Promise<Executors.IExecutor>} The executor instance.
             * 
             * @memberOf IModuleManager
             */
            getExecutor(config: Containers.IExecutorContainer): Promise<Executors.IExecutor>;
        }

        /**
         * Service manager is a service which is provided by Kanro, you can use this service to manage services.
         * 
         * @export
         * @interface IServiceManager
         * @extends {IService}
         */
        export interface IServiceManager extends Executors.IService {
            /**
             * Get a service instance of a installed module.
             * 
             * @param {Config.IServiceConfig} node 
             * 
             * @memberOf IServiceManager
             */
            getService(node: Containers.IServiceContainer);
            /**
             * Injection dependencies to executors.
             * 
             * @param {(Config.IExecutorConfig | Config.IExecutorConfig[])} Executors which need be injected 
             * 
             * @memberOf IServiceManager
             */
            fillServiceDependencies(node: Containers.IExecutorContainer | Containers.IExecutorContainer[]);
        }

        /**
         * Kanro manager is a service which is provided by Kanro, you can use this service to manage Kanro.
         * 
         * @export
         * @interface IKanroManager
         * @extends {IService}
         */
        export interface IKanroManager extends Executors.IService {
            /**
             * Reload configs, if config is undefined, the local configs will be used.
             * 
             * @param {Config.IKanroConfigs} configs 
             * @returns {Promise<void>} 
             * 
             * @memberOf IKanroManager
             */
            reloadConfigs(configs: Config.IKanroConfigs): Promise<void>;

            /**
             * Get a config from Kanro config, ect: 'port', 'registry' or 'resource'
             * 
             * @param {string} key 
             * @returns {*} 
             * 
             * @memberOf IKanroManager
             */
            getKanroConfig(key: string): any;
        }

        export interface ILoggerManager extends Executors.IService {
            registerLogger(namespace: string): Log.ILogger;

            getLogger(namespace: string): Log.ILogger;
        }

        interface IApplicationContext {
            moduleManager?: ModuleManager;
            serviceManager?: ServiceManager;
            LoggerManager?: LoggerManager;
            configs: Config.IKanroConfigs;
            application: Application;
        }

        class ModuleManager implements IModuleManager {
            type: Executors.ExecutorType.Service = Executors.ExecutorType.Service;
            services: { [name: string]: Executors.IService; } = {};
            name: string = "ModuleManager";
            modules: { [name: string]: Core.IModule };
            modulesIds: { [name: string]: string };
            context: IApplicationContext;
            dependencies?: { [name: string]: Executors.IService | Core.IModuleInfo }

            async installModule(name: string, version: string, reinstall: boolean = false): Promise<Core.IModule> {
                let result: Core.IModule;
                let moduleId = `${name}@${version}`;

                if (name == "kanro") {
                    if (version != "*") {
                        this.context.LoggerManager.Module.error(`Require a specific version module '${name}', kanro method should not specific version.`);
                        throw new Error();
                    }

                    return this.getModuleInternal(name, version);
                }

                if (version == "*") {
                    moduleId = `${name}`;
                    this.context.LoggerManager.Module.info(`Require a unspecific version module '${name}', you should not load a unspecific version module except 'kanro'.`);
                }

                if (await this.isModuleInstalled(name, version)) {
                    if (!reinstall) {
                        result = await this.getModuleInternal(name, version);
                        this.context.LoggerManager.Module.success(`Module '${moduleId}' have been installed.`);
                    }
                }

                if (result == undefined) {
                    try {
                        let installResult: Array<any> = <any>await new Promise((res, rej) => {
                            this.context.LoggerManager.NPM.info(`Module '${moduleId}' installing...`);

                            Npm.commands.install([`${moduleId}`], (err, data) => {
                                if (err) {
                                    this.context.LoggerManager.NPM.error(`NPM install module '${moduleId}' fail, message: '${err.message}'.`);
                                    rej(err);
                                    return;
                                }

                                this.context.LoggerManager.NPM.success(`NPM install module '${moduleId}' success.`);
                                res(data);
                            });
                        });

                        installResult = installResult[installResult.length - 1];
                        let data = installResult[0].split("@");
                        let moduleName = data[0];
                        let moduleVersion = data[1];
                        let newPath = `${IO.Path.parse(installResult[1]).dir}/.${moduleVersion}@${moduleName}`;

                        if (await IO.File.exists(newPath)) {
                            await IO.File.unlink(newPath);
                        }
                        await IO.File.rename(installResult[1], newPath);

                        result = this.getModuleInternal(moduleName, moduleVersion);
                        if (result.dependencies != undefined) {
                            for (var key in result.dependencies) {
                                await this.installModule(result.dependencies[key].name, result.dependencies[key].version);
                            }
                        }

                        this.context.LoggerManager.Module.success(`Install module '${name}@${version}' success! Path: '${newPath}'.`);
                    } catch (error) {
                        this.context.LoggerManager.Module.error(`Install module '${name}@${version}' fail! Message: '${error.message}'.`);
                        throw error;
                    }
                }

                return result;
            }

            getModule(name: string, version: string): Core.IModule {
                try {
                    return this.getModuleInternal(name, version);
                } catch (error) {
                    this.context.LoggerManager.Module.error(`Cannot find module '${name}@${version}', maybe you should install it before.`);
                    throw error;
                }
            }

            private getModuleInternal(name: string, version: string): Core.IModule {
                let moduleId = `${name}@${version}`;

                if (version == "*") {
                    moduleId = `${name}`;
                }

                if (this.modulesIds[moduleId] != undefined) {
                    moduleId = this.modulesIds[moduleId];
                }

                let result = this.modules[moduleId];

                if (result == undefined) {
                    try {
                        result = require(`.${version}@${name}`)["KanroModule"];
                        this.modulesIds[moduleId] = `${name}@${version}`;
                        this.modules[`${name}@${version}`] = result;
                    } catch (error) {

                    }
                }

                if (result == undefined) {
                    throw new Error("Module is not installed.");
                }

                try {
                    Kanro.Exceptions.ExceptionHelper.throwIfInvalidModule(result);
                } catch (error) {
                    this.context.LoggerManager.Module.error(`Module '${error}@${version}' is a invalid Kanro module.`);
                    throw error;
                }

                return result;
            }

            isModuleInstalled(name: string, version: string): boolean {
                let result: Core.IModule;

                try {
                    result = this.getModuleInternal(name, version);
                } catch (error) {
                    return false;
                }

                return true;
            }

            async getExecutor(config: Containers.IExecutorContainer): Promise<Executors.IExecutor> {
                let module = await this.getModuleInternal(config.module.name, config.module.version);
                let result = await module.getExecutor(config);

                try {
                    Kanro.Exceptions.ExceptionHelper.throwIfInvalidExecutor(result);
                } catch (error) {
                    this.context.LoggerManager.Module.error(`Node '${config.module.name}@${config.module.version}:${config.name}' is a invalid Kanro module.`);
                    throw error;
                }
                return result;
            }

            private constructor() {
                this.modules = {};
                this.modulesIds = {};
            }

            static async create(context: IApplicationContext): Promise<ModuleManager> {
                await new Promise((res, rej) => {
                    Npm.load({ registry: context.configs.appConfig.registry }, e => {
                        res(e);
                        context.LoggerManager.NPM.info(`Set NPM registry to '${context.configs.appConfig.registry}'.`);
                    });
                });

                Npm.on('log', function (message) {
                    this.context.LoggerManager.NPM.info(message)
                });

                let result = new ModuleManager();
                result.context = context;
                context.moduleManager = result;
                result.modules["kanro"] = new KanroModule(context);

                for (let module of context.configs.modulesConfig) {
                    await result.installModule(module.name, module.version);
                }

                return result;
            }
        }

        class ServiceManager implements IServiceManager {
            type: Executors.ExecutorType.Service = Executors.ExecutorType.Service;
            name: string = "ServiceManager";
            services: { [module: string]: { [name: string]: Containers.IServiceContainer } };
            nameOnlyServices: { [name: string]: Containers.IServiceContainer };
            context: IApplicationContext;
            dependencies?: { [name: string]: Executors.IService | Core.IModuleInfo }

            private async fillServiceInstance(node: Containers.IServiceContainer | (Containers.IServiceContainer)[]) {

                if (node == undefined) {
                    return;
                }

                if (Array.isArray(node)) {
                    for (let n of node) {
                        await this.fillServiceInstance(n);
                    }
                } else {
                    try {
                        if (node.name != null && node.module != null) {
                            node.instance = <any>await this.context.moduleManager.getExecutor(node);
                            if (node.instance == undefined) {
                                throw new Error("Module return service as 'undefined'");
                            }
                            if (this.services[`${node.module.name}@${node.module.version}`] == undefined) {
                                this.services[`${node.module.name}@${node.module.version}`] = {};
                            }
                            this.services[`${node.module.name}@${node.module.version}`][node.name] = node;
                            this.nameOnlyServices[node.name] = node;
                        }
                    } catch (error) {
                        this.context.LoggerManager.Service.error(`Fill service instance fail, message: ${error.message}`);
                        throw error;
                    }
                }
            }

            async fillServiceDependencies(node: Containers.IExecutorContainer | (Containers.IExecutorContainer)[]) {
                if (node == undefined) {
                    return;
                }

                if (Array.isArray(node)) {
                    for (let n of node) {
                        await this.fillServiceDependencies(n);
                    }
                } else {
                    if (node["instance"] == undefined) {
                        throw new Error("You must fill instance before fill dependencies.")
                    }

                    try {
                        let fill: Containers.IServiceContainer[] = [];
                        let fillInstance: { [name: string]: Executors.IService } = {};
                        let instance: Executors.IExecutor = node["instance"];

                        if (Array.isArray(node.dependencies)) {
                            for (let dependency of node.dependencies) {
                                let service = this.getService(dependency);
                                if (service == undefined || service.instance == undefined) {
                                    this.context.LoggerManager.Service.error(`Cannot find service '${dependency.module.name}@${dependency.module.version}:${dependency.name}', you should to define it in 'services.json'`);
                                    throw new Error(`Service '${dependency.module.name}@${dependency.module.version}:${dependency.name}' not found`);
                                }
                                fill.push(service);
                                if (fillInstance[service.name] != undefined) {
                                    fillInstance[`${dependency.module.name}@${dependency.module.version}:${dependency.name}`] = service.instance;
                                }
                                else {
                                    fillInstance[service.name] = service.instance;
                                }
                            }
                        }
                        node.dependencies = fill;

                        if (node["instance"] != undefined) {
                            let instance = <Executors.IExecutor>node["instance"];
                            if (instance.dependencies != undefined) {
                                for (let property in fillInstance) {
                                    instance.dependencies[property] = fillInstance[property];
                                }
                                for (let property in instance.dependencies) {
                                    if (instance.dependencies[property] != undefined && instance.dependencies[property]["name"] != undefined && instance.dependencies[property]["version"] != undefined) {
                                        let serviceConfig: Containers.IServiceContainer = { name: property, module: <Core.IModuleInfo>instance.dependencies[property], type: "Service" };
                                        let service = this.getService(serviceConfig);
                                        if (service != undefined) {
                                            instance.dependencies[property] = service.instance;
                                        } else {
                                            await this.fillServiceInstance(serviceConfig);
                                            await this.fillServiceDependencies(serviceConfig);
                                            service = this.getService(serviceConfig);

                                            if (service == undefined) {
                                                throw new Error(`'${instance.dependencies[property]["name"]}@${instance.dependencies[property]["version"]}:${property}' required in '${node.module.name}@${node.module.version}:${node.name}', but no service provided`);
                                            }

                                            instance.dependencies[property] = service.instance;
                                        }
                                    }
                                    else {
                                        if (instance.dependencies[property] == undefined) {
                                            if (this.nameOnlyServices[property] == undefined) {
                                                throw new Error(`'${property}' required in '${node.module.name}@${node.module.version}:${node.name}', but no service provided`);
                                            }
                                            else {
                                                instance.dependencies[property] = this.nameOnlyServices[property].instance;
                                            }
                                        }
                                    }
                                }
                            } else {
                                instance.dependencies = fillInstance;
                            }
                        }
                    } catch (error) {
                        this.context.LoggerManager.Service.error(`Solution dependent of '${node.module.name}@${node.module.version}:${node.name}' fail, message: ${error.message}`)
                        throw error;
                    }
                }
            }

            getService(node: Kanro.Containers.IServiceContainer): Kanro.Containers.IServiceContainer {
                if (this.services[`${node.module.name}@${node.module.version}`] == undefined) {
                    return undefined;
                }

                let result = this.services[`${node.module.name}@${node.module.version}`][node.name];

                if (result == null) {
                    this.context.LoggerManager.Service.error(`Service ${node.module.name}@${node.module.version}:${node.name} is undefined`);
                    return undefined;
                }
                if (result.type != "Service" && (result.instance == undefined || result.instance.type != Kanro.Executors.ExecutorType.Service)) {
                    this.context.LoggerManager.Service.error(`${node.module.name}@${node.module.version}:${node.name} is not a Service`);
                    return undefined;
                }

                return result;
            }

            private constructor() {
                this.services = {};
                this.nameOnlyServices = {};
            }

            static async create(context: IApplicationContext): Promise<ServiceManager> {
                let result = new ServiceManager();
                result.context = context;
                context.serviceManager = result;

                let services = context.configs.serviceConfig;
                await result.fillServiceInstance(services);
                await result.fillServiceDependencies(services);

                return result;
            }
        }

        class KanroManager implements IKanroManager {
            type: Kanro.Executors.ExecutorType.Service = Kanro.Executors.ExecutorType.Service;
            dependencies: { [name: string]: Kanro.Executors.IService; } = {};
            name: string = "KanroManager";
            context: IApplicationContext;

            async reloadConfigs(configs: Config.IKanroConfigs): Promise<void> {
                await this.context.application.reloadConfigs(configs);
            }

            getKanroConfig(key: string): any {
                return this.context.configs.appConfig[key];
            }

            constructor(context: IApplicationContext) {
                this.context = context;
            }
        }

        class LoggerManager implements ILoggerManager {
            private loggers: { [namespace: string]: Log.ILogger } = {};

            registerLogger(namespace: string): Log.ILogger {
                if (this.loggers[namespace] == undefined) {
                    this.loggers[namespace] = Log.LoggerFactory.buildLogger(namespace);
                }

                return this.loggers[namespace];
            }
            getLogger(namespace: string): Log.ILogger {
                return this.loggers[namespace];
            }

            type: Executors.ExecutorType.Service = Executors.ExecutorType.Service;
            dependencies: { [name: string]: Executors.IService | IModuleInfo; };
            name: string = "LoggerManager";

            get App(): Log.ILogger {
                return this.loggers["Kanro:App"];
            }

            get Module(): Log.ILogger {
                return this.loggers["Kanro:Module"];
            }

            get HTTP(): Log.ILogger {
                return this.loggers["Kanro:HTTP"];
            }

            get NPM(): Log.ILogger {
                return this.loggers["Kanro:NPM"];
            }

            get Config(): Log.ILogger {
                return this.loggers["Kanro:Config"];
            }

            get Router(): Log.ILogger {
                return this.loggers["Kanro:Router"];
            }

            get Service(): Log.ILogger {
                return this.loggers["Kanro:Service"];
            }

            constructor() {
                this.registerLogger("Kanro:App");
                this.registerLogger("Kanro:Module");
                this.registerLogger("Kanro:HTTP");
                this.registerLogger("Kanro:NPM");
                this.registerLogger("Kanro:Config");
                this.registerLogger("Kanro:Router");
                this.registerLogger("Kanro:Service");
            }
        }

        class KanroModule implements IModule {
            dependencies: Core.IModuleInfo[];
            context: IApplicationContext;
            executorInfos: { [name: string]: Executors.IExecutorInfo; };
            async getExecutor(config: Kanro.Containers.IExecutorContainer): Promise<Executors.IExecutor> {
                switch (config.name) {
                    case "KanroRouter":
                        return new Router.Router(<any>config);
                    case "ModuleManager":
                        return this.context.moduleManager;
                    case "ServiceManager":
                        return this.context.serviceManager;
                    case "LoggerManager":
                        return this.context.LoggerManager;
                    case "MethodRouter":
                        return new Router.MethodRouter(<any>config);
                    case "BaseRequestHandler":
                        return new Executors.BaseRequestHandler(<any>config);
                    case "BaseRequestDiverter":
                        return new Executors.BaseRequestDiverter(<any>config);
                    case "BaseRequestReplicator":
                        return new Executors.BaseRequestReplicator(<any>config);
                    case "BaseResponder":
                        return new Executors.BaseResponder(<any>config);
                    case "BaseResponseHandler":
                        return new Executors.BaseResponseHandler(<any>config);
                    case "BaseFuse":
                        return new Executors.BaseFuse(<any>config);
                    case "BaseExceptionHandler":
                        return new Executors.BaseExceptionHandler(<any>config);
                    case "BaseGlobalRequestHandler":
                        return new Executors.BaseGlobalRequestHandler(<any>config);
                    case "BaseGlobalResponseHandler":
                        return new Executors.BaseGlobalResponseHandler(<any>config);
                    case "BaseGlobalExceptionHandler":
                        return new Executors.BaseGlobalExceptionHandler(<any>config);
                }
                return undefined;
            }

            constructor(context: IApplicationContext) {
                this.context = context;
                this.executorInfos = {
                    KanroRouter: { type: Executors.ExecutorType.RequestDiverter, name: "KanroRouter" },
                    ModuleManager: { type: Executors.ExecutorType.Service, name: "ModuleManager" },
                    ServiceManager: { type: Executors.ExecutorType.Service, name: "ServiceManager" },
                    LoggerManager: { type: Executors.ExecutorType.Service, name: "LoggerManager" },
                    MethodRouter: { type: Executors.ExecutorType.RequestDiverter, name: "MethodRouter" },
                    BaseRequestHandler: { type: Executors.ExecutorType.RequestHandler, name: "BaseRequestHandler" },
                    BaseRequestDiverter: { type: Executors.ExecutorType.RequestDiverter, name: "BaseRequestDiverter" },
                    BaseRequestReplicator: { type: Executors.ExecutorType.RequestReplicator, name: "BaseRequestReplicator" },
                    BaseResponder: { type: Executors.ExecutorType.Responder, name: "BaseResponder" },
                    BaseResponseHandler: { type: Executors.ExecutorType.ResponseHandler, name: "BaseResponseHandler" },
                    BaseFuse: { type: Executors.ExecutorType.Fuse, name: "BaseFuse" },
                    BaseExceptionHandler: { type: Executors.ExecutorType.ExceptionHandler, name: "BaseExceptionHandler" },
                    BaseGlobalRequestHandler: { type: Executors.ExecutorType.GlobalRequestHandler, name: "BaseGlobalRequestHandler" },
                    BaseGlobalResponseHandler: { type: Executors.ExecutorType.GlobalResponseHandler, name: "BaseGlobalResponseHandler" },
                    BaseGlobalExceptionHandler: { type: Executors.ExecutorType.GlobalExceptionHandler, name: "BaseGlobalExceptionHandler" },
                };
            }
        }

        export class Application {
            httpServer: Web.Server;
            private context: IApplicationContext;
            private loggerManager: LoggerManager;

            die(error: Error, module: String) {
                this.loggerManager.App.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${error.stack}`)
                process.exit(-1);
            }

            private async fillExecutorInstance(context: IApplicationContext, node: Kanro.Containers.IExecutorContainer | (Kanro.Containers.IExecutorContainer)[]) {
                if (node == undefined) {
                    return;
                }

                if (Array.isArray(node)) {
                    for (let n of node) {
                        await this.fillExecutorInstance(context, n);
                    }
                } else {
                    if (node["name"] != null && node["module"] != null) {
                        try {
                            node["instance"] = await context.moduleManager.getExecutor(node);
                            if (node["instance"] == undefined) {
                                throw new Error(`ModuleManager return '${node.module.name}@${node.module.version}:${node.name}' as 'undefined'`);
                            }
                            await context.serviceManager.fillServiceDependencies(node);

                            if (node["instance"].onLoaded != undefined) {
                                await node["instance"].onLoaded();
                            }
                        } catch (error) {
                            context.LoggerManager.Module.error(`Create instance of '${node.module.name}@${node.module.version}:${node.name}' fail`)
                            throw error;
                        }
                    }

                    if (Array.isArray(node["next"])) {
                        for (let next of node["next"]) {
                            await this.fillExecutorInstance(context, next);
                        }
                    } else {
                        await this.fillExecutorInstance(context, node["next"]);
                    }
                    return;
                }
            }

            private async entryPoint(request: Web.IncomingMessage, response: Web.ServerResponse) {
                let result: { request: Http.Request | Http.RequestMirror, response: Http.Response, error?: Error } = { request: new Http.Request(request, response), response: undefined, error: undefined };
                let config = this.context.configs.executorsConfig;

                let time = Date.now();

                try {
                    try {
                        result = await this.handler(result.request, result.response, result.error, config.globalRequestHandler);
                        result = await this.handler(result.request, result.response, result.error, config.entryPoint);
                        result = await this.handler(result.request, result.response, result.error, config.globalRequestHandler);

                        if (result.response == undefined) {
                            throw new Kanro.Exceptions.KanroNotFoundException();
                        }
                    } catch (error) {
                        if (config.globalExceptionHandlers != undefined) {
                            let handerResult = undefined;
                            for (let exceptionHandler of config.globalExceptionHandlers) {
                                try {
                                    handerResult = await this.handler(result.request, result.response, error, exceptionHandler);
                                    if (handerResult != undefined) {
                                        break;
                                    }
                                } catch (error2) {
                                    continue;
                                }
                            }

                            if (handerResult != undefined) {
                                result = handerResult;
                            } else {
                                throw error;
                            }
                        }
                        else {
                            throw error;
                        }
                    }

                    if (result.response != undefined) {
                        if (result.response.status != undefined) {
                            response.statusCode = result.response.status;
                        }
                        if (result.response.header != undefined) {
                            for (var key in result.response.header) {
                                response.setHeader(key, result.response.header[key]);
                            }
                        }
                        if (result.response.body != undefined) {
                            result.response.body.write(response);
                        }

                        response.end();
                    }
                    else {
                        throw new Kanro.Exceptions.KanroNotFoundException();
                    }
                } catch (error) {
                    response.statusCode = 500;
                    response.end();
                    this.context.LoggerManager.HTTP.error(`Uncaught exception thrown in HTTP handler, message :'${error.message}'`)
                }

                this.context.LoggerManager.HTTP.info(`${request.method} ${request.url} ${response.statusCode} ${Date.now() - time}ms`)
            }

            private async handler(request: Http.Request | Http.RequestMirror, response: Http.Response, error: Error, executor: Kanro.Containers.IExecutorContainer): Promise<{ request: Http.Request | Http.RequestMirror, response: Http.Response, error?: Error }> {
                if (executor == undefined) {
                    return { request: request, response: response, error: error };
                }

                request.traceStack.push(executor);
                try {
                    let next: Kanro.Containers.IExecutorContainer;
                    switch (executor.type) {
                        case "RequestHandler":
                            {
                                let node = <Kanro.Containers.IRequestHandlerContainer>executor;
                                request = <any>await node.instance.handler(request);
                                next = node.next;
                                break;
                            }
                        case "RequestDiverter":
                            {
                                let node = <Kanro.Containers.IRequestDiverterContainer>executor;
                                next = await node.instance.shunt(request, node.next);
                                break;
                            }
                        case "RequestReplicator":
                            {
                                let node = <Kanro.Containers.IRequestReplicatorContainer>executor;
                                let nodes = node.next.map((c) => c.instance);

                                if (node.next.length == 0) {
                                    //TODO:
                                    throw new Error();
                                }

                                let requests = await node.instance.copy(request, node.next.length);

                                if (node.next.length != requests.length) {
                                    //TODO:
                                    throw new Error();
                                }

                                requests.forEach((v, i, a) => {
                                    if (i == 0) {
                                        request = <any>v;
                                    }
                                    else {
                                        this.handler(<any>v, undefined, undefined, node.next[i]);
                                    }
                                });

                                next = node.next[0];
                                break;
                            }
                        case "Responder":
                            {
                                let node = <Kanro.Containers.IResponderContainer>executor;
                                response = <any>await node.instance.respond(request);
                                next = node.next;
                                break;
                            }
                        case "ResponseHandler":
                            {
                                let node = <Kanro.Containers.IResponseHandlerContainer>executor;
                                response = <any>await node.instance.handler(response);
                                next = node.next;
                                break;
                            }
                        case "ExceptionHandler":
                            {
                                let node = <Kanro.Containers.IExceptionHandlerContainer>executor;
                                let res = <any>await node.instance.handler(error, request, response);
                                if (res == undefined) {
                                    return undefined;
                                }
                                next = node.next;
                                break;
                            }
                        case "Fuse":
                            {
                                let node = <Kanro.Containers.IFuseContainer>executor;
                                let req = <any>await node.instance.fusing(error, request);
                                if (req == undefined) {
                                    return undefined;
                                }
                                next = node.next;
                                break;
                            }
                        case "GlobalRequestHandler":
                            {
                                let node = <Kanro.Containers.IGlobalRequestHandlerContainer>executor;
                                try {
                                    request = <any>await node.instance.handler(request);
                                }
                                finally {
                                    next = node.next;
                                }
                                break;
                            }
                        case "GlobalResponseHandler":
                            {
                                let node = <Kanro.Containers.IGlobalResponseHandlerContainer>executor;
                                try {
                                    response = <any>await node.instance.handler(response);
                                }
                                finally {
                                    next = node.next;
                                }
                                break;
                            }
                        case "GlobalExceptionHandler":
                            {
                                let node = <Kanro.Containers.IGlobalExceptionHandlerContainer>executor;
                                try {
                                    let result = <any>await node.instance.handler(error, request, response);
                                    if (result == undefined) {
                                        return undefined;
                                    }
                                    response = result;
                                }
                                catch (err) {
                                    next = node.next;
                                }
                                break;
                            }
                        default:
                            //TODO:
                            throw new Error();
                    }

                    return await this.handler(request, response, error, next);
                } catch (error) {
                    let next: Kanro.Containers.IExecutorContainer;

                    if (executor.fuses != undefined) {
                        for (let fuse of executor.fuses) {
                            try {
                                let result = await this.handler(request, response, error, fuse);
                                if (result.error == undefined) {
                                    return result;
                                }
                            } finally {
                                continue;
                            }
                        }
                    }

                    if (executor.exceptionHandlers != undefined) {
                        for (let exceptionHandler of executor.exceptionHandlers) {
                            try {
                                let result = await this.handler(request, response, error, exceptionHandler);
                                if (result != undefined) {
                                    return result;
                                }
                            } catch (error2) {
                                continue;
                            }
                        }
                    }

                    throw error;
                }
            }

            async main(config?: Config.IKanroConfigs) {
                try {
                    this.loggerManager.App.info("Booting...");

                    if (config == undefined) {
                        this.loggerManager.Config.info("Unspecified configs, searching for configs...");
                        config = await Config.ConfigBuilder.readConfig();
                    }

                    this.loggerManager.App.info("Create application context...");
                    let context: IApplicationContext = { configs: config, application: this };
                    context.LoggerManager = this.loggerManager;

                    this.loggerManager.App.info("Booting HTTP server...");
                    await this.createHttpServer(context);

                    this.loggerManager.App.info("Initializing...");
                    await this.initialize(context);

                    this.context = context;
                    this.loggerManager.App.success("Kanro is ready.");
                } catch (error) {
                    this.die(error, "App");
                }
            }

            async reloadConfigs(config?: Config.IKanroConfigs) {
                try {
                    this.loggerManager.App.info("Reload configs...");

                    if (config == undefined) {
                        this.loggerManager.Config.info("Unspecified configs, searching for configs...");
                        config = await Config.ConfigBuilder.readConfig();
                    }

                    this.loggerManager.App.info("Create application context...");
                    let context: IApplicationContext = { configs: config, application: this };
                    context.LoggerManager = this.loggerManager;

                    this.loggerManager.App.info("Initializing application...");
                    await this.initialize(context);
                    this.loggerManager.App.info("Replace context...");
                    this.context = context;
                    this.loggerManager.App.success("Config have been reloaded");
                } catch (error) {
                    this.loggerManager.App.error(`An exception occurred in reload config, operation have been cancelled, message: '${error.message}'`);
                }
            }

            private async initialize(context: IApplicationContext) {
                this.loggerManager.App.info("Check module status...");
                context.moduleManager = await ModuleManager.create(context);
                this.loggerManager.App.info("Create services...");
                context.serviceManager = await ServiceManager.create(context);
                this.loggerManager.App.info("Initializing executors...");
                await this.fillExecutorInstance(context, context.configs.executorsConfig.entryPoint);
                await this.fillExecutorInstance(context, context.configs.executorsConfig.globalRequestHandler);
                await this.fillExecutorInstance(context, context.configs.executorsConfig.globalResponseHandler);
                await this.fillExecutorInstance(context, context.configs.executorsConfig.globalExceptionHandlers);
                return;
            }

            private async createHttpServer(context: IApplicationContext) {
                this.httpServer = Web.createServer((request, response) => {
                    this.entryPoint(request, response);
                });
                this.httpServer.on('error', (err) => {
                    this.loggerManager.HTTP.error(`Error in http server, message: '${err.message}'`);
                });
                this.httpServer.on('listening', (err) => {
                    if (err) {
                        this.loggerManager.HTTP.error(`Create http server fail, message: '${err.message}'`);
                        this.die(err, "HTTP");
                    }
                    this.loggerManager.HTTP.success(`Http server listening on '${context.configs.appConfig.port}'`);
                });
                this.httpServer.listen(context.configs.appConfig.port);
            }

            constructor() {
                this.loggerManager = new LoggerManager();
            }
        }
    }

    export namespace Executors {
        /**
        * A executor which can be used in Kanro.
        * 
        * @export
        * @interface IExecutor
        * @extends {IExecutorInfo}
        */
        export interface IExecutor extends IExecutorInfo {
            /**
             * The services which be dependent by this executor.
             * 
             * If a named 'undefined' property in this object, Kanro will find service in all loaded module and set service instance to property.
             * 
             * If a named 'IModuleInfo' property in this object, Kanro will find service in specified module and set service instance to property.
             * 
             * @type {{ [name: string]: IService }}
             * @memberOf IExecutor
             */
            dependencies?: { [name: string]: IService | Core.IModuleInfo };

            onLoaded?(): Promise<void>;
        }

        /**
         * Information of a Kanro executor.
         * 
         * @export
         * @interface IExecutorInfo
         */
        export interface IExecutorInfo {
            /**
             * Type of executor.
             * 
             * @type {ExecutorType}
             * @memberOf IExecutorInfo
             */
            type: ExecutorType;
            /**
             * Name of executor.
             * 
             * @type {string}
             * @memberOf IExecutorInfo
             */
            name: string;
        }

        /**
         * Type of executors.
         * 
         * @export
         * @enum {number}
         */
        export enum ExecutorType {
            RequestHandler,
            RequestDiverter,
            RequestReplicator,
            Responder,
            ResponseHandler,
            ExceptionHandler,
            Fuse,
            GlobalRequestHandler,
            GlobalResponseHandler,
            GlobalExceptionHandler,
            Service
        }

        /**
         * A service which can be used in Kanro.
         * 
         * @export
         * @interface IService
         * @extends {IExecutor}
         */
        export interface IService extends IExecutor {
            type: ExecutorType.Service;
        }

        /**
         * A request handler, a HTTP request will be input, then this executor will handle it and output the result to next executor.
         * 
         * You can implement this interface by request validator, authenticator or rewrite this request.
         * 
         * @export
         * @interface IRequestHandler
         * @extends {IExecutor}
         */
        export interface IRequestHandler extends IExecutor {
            /**
             * Handle this request.
             * 
             * @param {IRequest} request The request will be handle.
             * @returns {Promise<Http.IRequest>} The handled request.
             * 
             * @memberOf IRequestHandler
             */
            handler(request: Http.IRequest): Promise<Http.IRequest>;
            /**
             * Type of this executor, must be 'RequestHandler'.
             * 
             * @type {ExecutorType.RequestHandler}
             * @memberOf IRequestHandler
             */
            type: ExecutorType.RequestHandler;
        }

        /**
         * A request diverter, a HTTP request will be input, then this executor will select next executor which will handle the request in executors list.
         * 
         * You can implement this interface by request router, load balancing.
         * 
         * @export
         * @interface IRequestDiverter
         * @extends {IRoutingNode}
         */
        export interface IRequestDiverter extends IExecutor {
            /**
             * Divert this request.
             * 
             * @param {IRequest} request The request will be diverted.
             * @param {IRoutingNode[]} executors Executors list.
             * @returns {Promise<number>} Selected executor.
             * 
             * @memberOf IRequestDiverter
             */
            shunt(request: Http.IRequest, executors: Containers.IExecutorContainer[]): Promise<Containers.IExecutorContainer>;
            /**
             * Type of this executor, must be 'RequestDiverter'.
             * 
             * @type {ExecutorType.RequestDiverter}
             * @memberOf IRequestDiverter
             */
            type: ExecutorType.RequestDiverter;
        }

        /**
         * A request replicator, a HTTP request will be input, then this executor will copy the input request, return a request list.
         * 
         * You can implement this interface by async request handler.
         * 
         * Note: the count of returns must be equal to 'count' param, and the first of returns must be original request.
         * 
         * @export
         * @interface IRequestDiverter
         * @extends {IRoutingNode}
         */
        export interface IRequestReplicator extends IExecutor {
            /**
             * Copy request.
             * 
             * @param {Http.IRequest} request The request will be copied.
             * @param {number} count Count of the returns.
             * @returns {Promise<Http.IRequest[]>} Result request list.
             * 
             * @memberOf IRequestReplicator
             */
            copy(request: Http.IRequest, count: number): Promise<Http.IRequest[]>;
            /**
             * Type of this executor, must be 'RequestReplicator'.
             * 
             * @type {ExecutorType.RequestReplicator}
             * @memberOf IRequestReplicator
             */
            type: ExecutorType.RequestReplicator;
        }

        /**
         * A responder, a HTTP request will be input, then this executor will respond this request, convert this request to a response, output result response to next executor.
         * 
         * Note: You can use the 'request.respond()' method to convert request to a response.
         * 
         * @export
         * @interface IResponder
         * @extends {IRoutingNode}
         * @see IRequest
         */
        export interface IResponder extends IExecutor {
            /**
             * Convert request to response.
             * 
             * @param {Http.IRequest} request The input request.
             * @returns {Promise<Http.IResponse>} Result response.
             * 
             * @memberOf IResponder
             */
            respond(request: Http.IRequest): Promise<Http.IResponse>;
            /**
             * Type of this executor, must be 'Responder'.
             * 
             * @type {ExecutorType.Responder}
             * @memberOf IResponder
             */
            type: ExecutorType.Responder;
        }

        /**
         * A response handler, a HTTP response will be input, then this executor will handle it and output the result to next executor.
         * 
         * You can implement this interface by response validator or rewrite this response.
         * 
         * @export
         * @interface IResponseHandler
         * @extends {IRoutingNode}
         */
        export interface IResponseHandler extends IExecutor {
            /**
             * Handle this response.
             * 
             * @param {Http.IResponse} response The input response.
             * @returns {Promise<Http.IResponse>} Result response.
             * 
             * @memberOf IResponseHandler
             */
            handler(response: Http.IResponse): Promise<Http.IResponse>;
            /**
             * Type of this executor, must be 'ResponseHandler'.
             * 
             * @type {ExecutorType.ResponseHandler}
             * @memberOf IResponseHandler
             */
            type: ExecutorType.ResponseHandler;
        }

        /**
         * A exception handler, a error and other information will be input, if this executor understand this error, it will output a response.
         * 
         * You can implement this interface by friendly error message output.
         * 
         * @export
         * @interface IExceptionHandler
         * @extends {IRoutingNode}
         */
        export interface IExceptionHandler extends IExecutor {
            /**
             * If this executor understand this error, return the response, otherwise return undefined.
             * 
             * @param {Error} err The error which occurred.
             * @param {Http.IRequest} request Request information.
             * @param {Http.IResponse} response Response information.
             * @returns {Promise<Http.IResponse>} Result response or undefined.
             * 
             * @memberOf IExceptionHandler
             */
            handler(err: Error, request: Http.IRequest, response: Http.IResponse): Promise<Http.IResponse>;
            /**
             * Type of this executor, must be 'ExceptionHandler'.
             * 
             * @type {ExecutorType.ExceptionHandler}
             * @memberOf IExceptionHandler
             */
            type: ExecutorType.ExceptionHandler;
        }

        /**
         * A fuse, a error and request information will be input, if this fuse understand this error, it will output a request to next executor.
         * 
         * You can implement this interface by service degradation.
         * 
         * @export
         * @interface IFuse
         * @extends {IRoutingNode}
         */
        export interface IFuse extends IExecutor {
            /**
             * Fusing, if this fuse understand this error, return the request, otherwise return undefined.
             * 
             * @param {Error} err The error which occurred.
             * @param {Http.IRequest} request Request information.
             * @returns {Promise<Http.IRequest>} Result request or undefined.
             * 
             * @memberOf IFuse
             */
            fusing(err: Error, request: Http.IRequest): Promise<Http.IRequest>;
            /**
             * Type of this executor, must be 'Fuse'.
             * 
             * @type {ExecutorType.Fuse}
             * @memberOf IFuse
             */
            type: ExecutorType.Fuse;
        }

        /**
         * A global request handler, a HTTP request will be input, then this executor will handle it and output the result to next global request handler.
         * 
         * You can implement this interface by request logger or authenticator.
         * 
         * @export
         * @interface IGlobalRequestHandler
         * @extends {IRoutingNode}
         */
        export interface IGlobalRequestHandler extends IExecutor {
            /**
             * Handle this request.
             * 
             * @param {IRequest} request The request will be handle.
             * @returns {Promise<Http.IRequest>} The handled request.
             * 
             * @memberOf IRequestHandler
             */
            handler(request: Http.IRequest): Promise<Http.IRequest>;
            /**
             * Type of this executor, must be 'GlobalRequestHandler'.
             * 
             * @type {ExecutorType.GlobalRequestHandler}
             * @memberOf IGlobalRequestHandler
             */
            type: ExecutorType.GlobalRequestHandler;
        }

        /**
         * A global response handler, a HTTP response will be input, then this executor will handle it and output the result to next global response handler.
         * 
         * You can implement this interface by response logger.
         * 
         * @export
         * @interface IResponseHandler
         * @extends {IRoutingNode}
         */
        export interface IGlobalResponseHandler extends IExecutor {
            /**
             * Handle this response.
             * 
             * @param {Http.IResponse} response The input response.
             * @returns {Promise<Http.IResponse>} Result response.
             * 
             * @memberOf IGlobalResponseHandler
             */
            handler(response: Http.IResponse): Promise<Http.IResponse>;
            /**
             * Type of this executor, must be 'GlobalResponseHandler'.
             * 
             * @type {ExecutorType.GlobalResponseHandler}
             * @memberOf IGlobalResponseHandler
             */
            type: ExecutorType.GlobalResponseHandler;
        }

        /**
         * A global exception handler, a error and other information will be input, if this executor understand this error, it will output a response.
         * 
         * You can implement this interface by friendly error message output.
         * 
         * @export
         * @interface IExceptionHandler
         * @extends {IRoutingNode}
         */
        export interface IGlobalExceptionHandler extends IExecutor {
            /**
             * If this executor understand this error, return the response, otherwise return undefined.
             * 
             * @param {Error} err The error which occurred.
             * @param {Http.IRequest} request Request information.
             * @param {Http.IResponse} response Response information.
             * @returns {Promise<Http.IResponse>} Result response or undefined.
             * 
             * @memberOf IGlobalExceptionHandler
             */
            handler(err: Error, request: Http.IRequest, response: Http.IResponse): Promise<Http.IResponse>;
            /**
             * Type of this executor, must be 'GlobalExceptionHandler'.
             * 
             * @type {ExecutorType.GlobalExceptionHandler}
             * @memberOf IGlobalExceptionHandler
             */
            type: ExecutorType.GlobalExceptionHandler;
        }

        export class BaseExecutor implements IExecutor {
            dependencies: { [name: string]: IService | Core.IModuleInfo; };
            type: ExecutorType;
            name: string;

            constructor(config: Containers.IExecutorContainer) {
                this.dependencies = {};
            }
        }

        export class BaseRequestHandler extends BaseExecutor implements IRequestHandler {

            async handler(request: Http.IRequest): Promise<Http.IRequest> {
                return request;
            }
            type: ExecutorType.RequestHandler = ExecutorType.RequestHandler;
            name: string = "BaseRequestHandler";

            constructor(config: Containers.IRequestHandlerContainer) {
                super(config);
            }
        }

        export class BaseRequestDiverter extends BaseExecutor implements IRequestDiverter {
            index: number = 0;
            async shunt(request: Http.IRequest, nodes: Containers.IExecutorContainer[]): Promise<Containers.IExecutorContainer> {
                let i = this.index % nodes.length;
                this.index++;
                if (this.index == nodes.length) {
                    this.index = 0;
                }
                return nodes[i];
            }
            type: ExecutorType.RequestDiverter;
            name: string = "BaseRequestDiverter";

            constructor(config: Containers.IRequestDiverterContainer) {
                super(config);
            }
        }

        export class BaseRequestReplicator extends BaseExecutor implements IRequestReplicator {
            async copy(request: Http.IRequest, count: number): Promise<Http.IRequest[]> {
                let result: Http.IRequest[] = [];
                result.push(request);

                for (var index = 0; index < count; index++) {
                    result.push(request.fork());
                }

                return result;
            }
            type: ExecutorType.RequestReplicator = ExecutorType.RequestReplicator;
            name: string = "BaseRequestReplicator";

            constructor(config: Containers.IRequestReplicatorContainer) {
                super(config);
            }
        }

        export class BaseResponder extends BaseExecutor implements IResponder {
            async respond(request: Http.IRequest): Promise<Http.IResponse> {
                let response = request.respond();
                response.status = 200;
                response.body = new Http.JsonResponseBody(this.response);
                return response;
            }

            response: any;
            type: ExecutorType.Responder = ExecutorType.Responder;
            name: string = "BaseResponder";

            constructor(config: Containers.IResponderContainer) {
                super(config);
                if (config["response"] != undefined) {
                    this.response = config["response"];
                } else {
                    this.response = { code: 0, message: "normal" };
                }
            }
        }

        export class BaseResponseHandler extends BaseExecutor implements IResponseHandler {
            async handler(response: Http.IResponse): Promise<Http.IResponse> {
                return response;
            }

            type: ExecutorType.ResponseHandler = ExecutorType.ResponseHandler;
            name: string = "BaseResponseHandler";

            constructor(config: Containers.IResponseHandlerContainer) {
                super(config);
            }
        }

        export class BaseExceptionHandler extends BaseExecutor implements IExceptionHandler {
            async handler(err: Error, request: Http.IRequest, response: Http.IResponse): Promise<Http.IResponse> {
                if (!err.name.startsWith("Error.Kanro.Http")) {
                    return undefined;
                } else {
                    let kanroHttpException: Exceptions.KanroHttpException = <any>err;

                    let response = request.respond();
                    response.status = kanroHttpException.status;
                    response.body = new Http.JsonResponseBody({ code: response.status, message: kanroHttpException.message });
                    return response;
                }

            }

            type: ExecutorType.ExceptionHandler = ExecutorType.ExceptionHandler;
            name: string = "BaseExceptionHandler";

            constructor(config: Containers.IExceptionHandlerContainer) {
                super(config);
            }
        }

        export class BaseFuse extends BaseExecutor implements IFuse {
            async fusing(err: Error, request: Http.IRequest): Promise<Http.IRequest> {
                return request;
            }

            type: ExecutorType.Fuse = ExecutorType.Fuse;
            name: string = "BaseExceptionHandler";

            constructor(config: Containers.IFuseContainer) {
                super(config);
            }
        }

        export class BaseGlobalRequestHandler extends BaseExecutor implements IGlobalRequestHandler {
            async handler(request: Http.IRequest): Promise<Http.IRequest> {
                return request;
            }
            type: ExecutorType.GlobalRequestHandler = ExecutorType.GlobalRequestHandler;
            name: string = "BaseGlobalRequestHandler";

            constructor(config: Containers.IGlobalRequestHandlerContainer) {
                super(config);
            }
        }

        export class BaseGlobalResponseHandler extends BaseExecutor implements IGlobalResponseHandler {
            async handler(response: Http.IResponse): Promise<Http.IResponse> {
                return response;
            }

            type: ExecutorType.GlobalResponseHandler = ExecutorType.GlobalResponseHandler;
            name: string = "BaseGlobalResponseHandler";

            constructor(config: Containers.IGlobalResponseHandlerContainer) {
                super(config);
            }
        }

        export class BaseGlobalExceptionHandler extends BaseExecutor implements IGlobalExceptionHandler {
            async handler(err: Error, request: Http.IRequest, response: Http.IResponse): Promise<Http.IResponse> {
                if (!err.name.startsWith("Error.Kanro.Http")) {
                    return undefined;
                } else {
                    let kanroHttpException: Exceptions.KanroHttpException = <any>err;

                    let response = request.respond();
                    response.status = kanroHttpException.status;
                    response.body = new Http.JsonResponseBody({ code: response.status, message: kanroHttpException.message });
                    return response;
                }

            }

            type: ExecutorType.GlobalExceptionHandler = ExecutorType.GlobalExceptionHandler;
            name: string = "BaseGlobalExceptionHandler";

            constructor(config: Containers.IGlobalExceptionHandlerContainer) {
                super(config);
            }
        }
    }

    export namespace Config {
        export interface IExecutorsConfig {
            /**
             * The entry point of the links.
             * 
             * @type {(Containers.IRequestHandlerConfig | Containers.IRequestDiverterConfig | Containers.IRequestReplicatorConfig | Containers.IResponderConfig)}
             * @memberOf IExecutorsConfig
             */
            entryPoint: Containers.IRequestHandlerContainer | Containers.IRequestDiverterContainer | Containers.IRequestReplicatorContainer | Containers.IResponderContainer;
            /**
             * Global exception handler, if some uncaught exception be threw in links, the global exception handler will handle it.
             * 
             * @type {Containers.IGlobalExceptionHandlerConfig[]}
             * @memberOf IExecutorsConfig
             */
            globalExceptionHandlers: Containers.IGlobalExceptionHandlerContainer[];
            /**
             * Global request handler, all request will be handled with it.
             * 
             * @type {Containers.IGlobalRequestHandlerConfig}
             * @memberOf IExecutorsConfig
             */
            globalRequestHandler: Containers.IGlobalRequestHandlerContainer;
            /**
             * Global response handler, all response will be handled with it.
             * 
             * @type {Containers.IGlobalResponseHandlerConfig}
             * @memberOf IExecutorsConfig
             */
            globalResponseHandler: Containers.IGlobalResponseHandlerContainer;
        }

        export interface IServicesConfig extends Array<Containers.IServiceContainer> {

        }

        export interface IServicesConfig extends Array<Containers.IServiceContainer> {

        }

        export interface IModulesConfig extends Array<Core.IModuleInfo> {

        }

        /**
         * Config of Kanro APP.
         * 
         * @export
         * @interface IAppConfig
         */
        export interface IAppConfig {
            /**
             * The port what Kanro HTTP server will listen.
             * 
             * @type {number}
             * @memberOf IAppConfig
             */
            port: number;
            /**
             * The NPM registry what module manager will used.
             * 
             * @type {string}
             * @memberOf IAppConfig
             */
            registry?: string;
            /**
             * The static resource dir of app.
             * 
             * @type {string}
             * @memberOf IAppConfig
             */
            resource: string;
        }

        export interface IKanroConfigs {
            appConfig?: IAppConfig;
            modulesConfig?: IModulesConfig;
            serviceConfig?: IServicesConfig;
            executorsConfig?: IExecutorsConfig;
        }

        export interface IKanroConfigFiles {
            appConfig?: string;
            modulesConfig?: string;
            serviceConfig?: string;
            executorsConfig?: string;
        }

        export class ConfigBuilder {
            private static ajv: Ajv.Ajv;

            static async readConfig(): Promise<Config.IKanroConfigs> {
                let files: Config.IKanroConfigFiles = {};

                if (await IO.File.exists(`${process.cwd()}/kanro.json`)) {
                    files.appConfig = `${process.cwd()}/kanro.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/kanro.json`)) {
                    files.appConfig = `${__dirname}/configs/kanro.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/default/kanro.json`)) {
                    files.appConfig = `${__dirname}/configs/default/kanro.json`;
                }
                else {
                    throw new Error("Kanro config 'kanro.json' not found.");
                }

                if (await IO.File.exists(`${process.cwd()}/modules.json`)) {
                    files.modulesConfig = `${process.cwd()}/modules.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/modules.json`)) {
                    files.modulesConfig = `${__dirname}/configs/modules.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/default/modules.json`)) {
                    files.modulesConfig = `${__dirname}/configs/default/modules.json`;
                }
                else {
                    throw new Error("Kanro config 'modules.json' not found.");
                }

                if (await IO.File.exists(`${process.cwd()}/services.json`)) {
                    files.serviceConfig = `${process.cwd()}/services.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/services.json`)) {
                    files.serviceConfig = `${__dirname}/configs/services.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/default/services.json`)) {
                    files.serviceConfig = `${__dirname}/configs/default/services.json`;
                }
                else {
                    throw new Error("Kanro config 'services.json' not found.");
                }

                if (await IO.File.exists(`${process.cwd()}/executors.json`)) {
                    files.executorsConfig = `${process.cwd()}/executors.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/executors.json`)) {
                    files.executorsConfig = `${__dirname}/configs/executors.json`;
                }
                else if (await IO.File.exists(`${__dirname}/configs/default/executors.json`)) {
                    files.executorsConfig = `${__dirname}/configs/default/executors.json`;
                }
                else {
                    throw new Error("Kanro config 'executors.json' not found.");
                }

                return await ConfigBuilder.readConfigFromFile(files);
            }

            static async readConfigFromFile(files: IKanroConfigFiles): Promise<Config.IKanroConfigs> {
                let result: Config.IKanroConfigs = {};

                result.appConfig = <any>await IO.File.readJson(files.appConfig);
                result.modulesConfig = <any>await IO.File.readJson(files.modulesConfig);
                result.serviceConfig = <any>await IO.File.readJson(files.serviceConfig);
                result.executorsConfig = <any>await IO.File.readJson(files.executorsConfig);

                return await ConfigBuilder.readConfigFromObject(result);
            }

            static async readConfigFromPath(path: string): Promise<Config.IKanroConfigs> {
                let files: Config.IKanroConfigFiles = {};

                if (IO.File.exists(`${path}/kanro.json`)) {
                    files.appConfig = `${path}/kanro.json`;
                }
                else {
                    throw new Error("Kanro config 'kanro.json' not found.");
                }

                if (IO.File.exists(`${path}/modules.json`)) {
                    files.modulesConfig = `${path}/modules.json`;
                }
                else {
                    throw new Error("Kanro config 'modules.json' not found.");
                }

                if (IO.File.exists(`${path}/services.json`)) {
                    files.serviceConfig = `${path}/services.json`;
                }
                else {
                    throw new Error("Kanro config 'services.json' not found.");
                }

                if (IO.File.exists(`${path}/executors.json`)) {
                    files.executorsConfig = `${path}/executors.json`;
                }
                else {
                    throw new Error("Kanro config 'executors.json' not found.");
                }

                return await ConfigBuilder.readConfigFromFile(files);
            }

            static async readConfigFromObject(config: Config.IKanroConfigs): Promise<Config.IKanroConfigs> {
                await ConfigBuilder.validate(config);
                return config;
            }

            static async validate(config: Config.IKanroConfigs): Promise<Config.IKanroConfigs> {
                if (config != undefined) {
                    if (config.appConfig != undefined) {
                        await ConfigBuilder.validateConfig(config.appConfig, "kanro");
                    }
                    else {
                        throw new Error("appConfig is 'undefined'.");
                    }

                    if (config.modulesConfig != undefined) {
                        await ConfigBuilder.validateConfig(config.modulesConfig, "modules");
                    }
                    else {
                        throw new Error("modulesConfig is 'undefined'.");
                    }

                    if (config.serviceConfig != undefined) {
                        await ConfigBuilder.validateConfig(config.serviceConfig, "services");
                    }
                    else {
                        throw new Error("serviceConfig is 'undefined'.");
                    }

                    if (config.executorsConfig != undefined) {
                        await ConfigBuilder.validateConfig(config.executorsConfig, "executors");
                    }
                    else {
                        throw new Error("executorsConfig is 'undefined'.");
                    }
                }
                else {
                    throw new Error("Config is 'undefined'.");
                }

                return config;
            }

            private static async validateConfig(config: object, type: "executors" | "kanro" | "modules" | "services"): Promise<any> {
                await ConfigBuilder.initialize();

                if (!ConfigBuilder.ajv.validate(type, config)) {
                    throw new Exceptions.KanroInvalidConfigException(type, ConfigBuilder.ajv.errors.pop().message);
                }

                return config;
            }

            static async initialize() {
                if (ConfigBuilder.ajv != undefined) {
                    return;
                }

                ConfigBuilder.ajv = new Ajv();

                let schemas = await IO.File.readdir(`${__dirname}/schema`);

                for (let schema of schemas) {
                    let file = `${__dirname}/schema/${schema}`;
                    let fileInfo = IO.Path.parse(schema);
                    if (fileInfo.ext != ".json") {
                        continue;
                    }

                    let schemaObject = await IO.File.readJson(file);
                    if (!ConfigBuilder.ajv.validateSchema(schemaObject)) {
                        continue;
                    }

                    ConfigBuilder.ajv.addSchema(schemaObject, fileInfo.name);
                }
            }
        }
    }

    export namespace Containers {
        export interface IServiceContainer {
            name: string;
            type: "Service";
            module: Core.IModuleInfo;
            instance?: Executors.IService;
            dependencies?: IServiceContainer[];
        }

        export interface IExecutorContainer {
            name: string;
            module: Core.IModuleInfo;
            type: string;
            exceptionHandlers?: IExceptionHandlerContainer[];
            fuses?: IFuseContainer[];
            dependencies?: IServiceContainer[];
        }

        export interface IRequestHandlerContainer extends IExecutorContainer {
            type: "RequestHandler";
            next: IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer;
            instance?: Executors.IRequestHandler;
        }

        export interface IRequestDiverterContainer extends IExecutorContainer {
            type: "RequestDiverter";
            next: (IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer)[];
            instance?: Executors.IRequestDiverter;
        }

        export interface IRequestReplicatorContainer extends IExecutorContainer {
            type: "RequestReplicator";
            next: (IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer)[];
            instance?: Executors.IRequestReplicator;
        }

        export interface IResponderContainer extends IExecutorContainer {
            type: "Responder";
            next: IResponseHandlerContainer;
            instance?: Executors.IResponder;
        }

        export interface IResponseHandlerContainer extends IExecutorContainer {
            type: "ResponseHandler";
            next: IResponseHandlerContainer;
            instance?: Executors.IResponseHandler;
        }

        export interface IExceptionHandlerContainer extends IExecutorContainer {
            type: "ExceptionHandler";
            next: IResponseHandlerContainer;
            instance?: Executors.IExceptionHandler;
        }

        export interface IFuseContainer extends IExecutorContainer {
            type: "Fuse";
            next: IRequestHandlerContainer | IRequestDiverterContainer | IRequestReplicatorContainer | IResponderContainer;
            instance?: Executors.IFuse;
        }

        export interface IGlobalRequestHandlerContainer extends IExecutorContainer {
            type: "GlobalRequestHandler";
            next: IGlobalRequestHandlerContainer;
            instance?: Executors.IGlobalRequestHandler;
        }

        export interface IGlobalResponseHandlerContainer extends IExecutorContainer {
            type: "GlobalResponseHandler";
            next: IGlobalResponseHandlerContainer;
            instance?: Executors.IGlobalResponseHandler;
        }

        export interface IGlobalExceptionHandlerContainer extends IExecutorContainer {
            type: "GlobalExceptionHandler";
            next: IResponseHandlerContainer;
            instance?: Executors.IGlobalExceptionHandler;
        }
    }

    export namespace Router {
        export class RouterNode {
            path: string;
            children: { [name: string]: RouterNode } = {};
            executor: Kanro.Containers.IExecutorContainer;
            routerKey: RouterKey;


            constructor(path: string) {
                this.path = path;
                if (path != undefined) {
                    this.routerKey = new RouterKey(path);
                }
            }

            addRouter(executor: Kanro.Containers.IExecutorContainer, routerKey: string) {
                let keys = Utils.StringUtils.pathSplit(routerKey).reverse();
                this.add(executor, keys);
            }

            private add(executor: Kanro.Containers.IExecutorContainer, keys: string[]) {
                if (keys.length == 0) {
                    if (this.executor != null) {
                        //TODO: 
                        throw new Error();
                    }
                    this.executor = executor;
                    return;
                }

                if (this.routerKey != undefined && this.routerKey.key == "**" && keys.length > 0) {
                    throw new Error("Cannot use '**' as a middle node");
                }

                let key = keys.pop();

                if (this.children[key] == undefined) {
                    this.children[key] = new RouterNode(key);
                }

                this.children[key].add(executor, keys);
            }

            matchRequest(request: Http.Request, deep: number = 0, routerStack: RouterKey[] = [], param: { [name: string]: string } = {}): RouterResult[] {
                if (this.path == undefined) {
                    if (request.routerKey.length == deep && Object.keys(this.children).length == 0) {
                        return [new RouterResult(this.executor, deep, [], {})];
                    }
                    let results = [];
                    for (let name in this.children) {
                        let result = this.children[name].matchRequest(request, deep, routerStack, { ...param });

                        if (Array.isArray(result)) {
                            results = results.concat(result);
                            continue;
                        }
                    }
                    return results;
                }

                let key = request.routerKey[deep];
                routerStack.push(this.routerKey);

                if (this.routerKey.match(key) && (deep <= request.routerKey.length)) {
                    if (this.routerKey.type == RouterKeyType.Param) {
                        param[this.routerKey.key] = key;
                    }
                    else if (this.routerKey.type == RouterKeyType.Wildcard && this.routerKey.key == "**") {
                        if (this.executor == undefined) {
                            return [];
                        }
                        return [new RouterResult(this.executor, deep, this.forkAndPopRouterStack(routerStack), param)];
                    }

                    if (deep >= request.routerKey.length - 1 && this.executor != undefined) {
                        return [new RouterResult(this.executor, deep, this.forkAndPopRouterStack(routerStack), param)];
                    }
                    else {
                        let results = [];
                        for (let name in this.children) {
                            let result = this.children[name].matchRequest(request, deep + 1, routerStack, { ...param });

                            if (Array.isArray(result)) {
                                results = results.concat(result);
                                continue;
                            }
                        }

                        routerStack.pop();
                        return results;
                    }
                }
                else {
                    routerStack.pop();
                    return [];
                }
            }

            forkAndPopRouterStack(routerStack: RouterKey[]) {
                let stack = Utils.ObjectUtils.copy(routerStack);
                routerStack.pop();
                return stack;
            }
        }

        export class RouterResult {
            param: { [name: string]: string };
            executor: Kanro.Containers.IExecutorContainer;
            deep: number;
            routerStack: RouterKey[];

            constructor(executor: Kanro.Containers.IExecutorContainer, deep: number, routerStack: RouterKey[], param: { [name: string]: string } = {}) {
                this.executor = executor;
                this.deep = deep;
                this.routerStack = routerStack;
                this.param = param;
            }
        }

        export class Router extends Kanro.Executors.BaseExecutor implements Kanro.Executors.IRequestDiverter {
            async shunt(request: Kanro.Http.IRequest, nodes: Kanro.Containers.IExecutorContainer[]): Promise<Kanro.Containers.IExecutorContainer> {
                let result = this.node.matchRequest(<any>request, (<Http.Request>request).routerIndex);

                let deep = -1;
                let selectedNode: RouterResult = undefined;
                for (let node of result) {
                    if (node.deep > deep) {
                        deep = node.deep;
                        selectedNode = node;
                    } else if (node.deep == deep) {
                        for (var index = 0; index < selectedNode.routerStack.length; index++) {
                            if (selectedNode.routerStack[index].type < node.routerStack[index].type) {
                                selectedNode = node;
                                break;
                            } else if (selectedNode.routerStack[index].type > node.routerStack[index].type) {
                                break;
                            }
                        }
                    }
                }

                if (selectedNode == undefined || selectedNode.executor == undefined) {
                    throw new Kanro.Exceptions.KanroNotFoundException();
                }

                (<Http.Request>request).routerIndex = deep;
                request["param"] = Object.assign(request["param"] == undefined ? {} : request["param"], selectedNode.param);
                return selectedNode.executor;
            }
            type: Kanro.Executors.ExecutorType.RequestDiverter = Kanro.Executors.ExecutorType.RequestDiverter;
            name: string = "KanroRouter";
            node: RouterNode;
            preRouters: string;
            dependencies: { [name: string]: Executors.IService | Core.IModuleInfo; } = {};
            config: Kanro.Containers.IRequestDiverterContainer;

            constructor(config: Kanro.Containers.IRequestDiverterContainer) {
                super(config);
                this.preRouters = config["preRouters"] != undefined ? config["preRouters"] : "";
                this.config = config;
                this.dependencies["LoggerManager"] = Kanro.ModuleInfo;
            }

            async onLoaded() {
                this.config.next = [];
                this.node = new RouterNode(undefined);
                for (let name in this.config) {
                    if (name.startsWith("/")) {
                        this.config.next.push(this.config[name]);
                        this.node.addRouter(this.config[name], name);
                        if (name.endsWith("/**")) {
                            this.addRouterKeyToNextRouter(`${this.preRouters}${name.slice(0, name.length - 3)}`, this.config[name]);
                        }
                        else {
                            (<any>this.dependencies["LoggerManager"]).Router.success(`Router node '${this.preRouters}${name}' added`);
                        }
                    }
                }
            }

            addRouterKeyToNextRouter(key: string, executor: Kanro.Executors.IExecutor[] | Kanro.Executors.IExecutor) {
                if (executor == undefined) {
                    return;
                }

                if (key.endsWith("/")) {
                    key = key.slice(0, key.length - 1);
                }
                if (Array.isArray(executor)) {
                    for (let e of executor) {
                        this.addRouterKeyToNextRouter(key, e);
                    }
                    return;
                }

                if (executor.name == this.name) {
                    let router = <Router>executor;
                    if (router.preRouters == undefined) {
                        router.preRouters = "";
                    }
                    router.preRouters += key;

                    for (let routerKey in router) {
                        if (routerKey.startsWith("/")) {
                            this.addRouterKeyToNextRouter(key, router[routerKey]);
                        }
                    }
                }

                this.addRouterKeyToNextRouter(key, executor["next"]);
            }
        }

        export enum RouterKeyType {
            Wildcard,
            Param,
            Path,
        }

        export class RouterKey {
            key: string;
            regex: RegExp;
            type: RouterKeyType;

            constructor(stringKey: string) {
                if (stringKey == "*") {
                    this.key = stringKey;
                    this.type = RouterKeyType.Wildcard;
                }
                else if (stringKey == "**") {
                    this.key = stringKey;
                    this.type = RouterKeyType.Wildcard;
                }
                else if (stringKey.startsWith("{") && stringKey.endsWith("}")) {
                    this.type = RouterKeyType.Param;
                    let index = stringKey.indexOf(":")
                    if (index < 0) {
                        this.key = stringKey.slice(1, stringKey.length - 1);
                    }
                    else {
                        this.key = stringKey.slice(1, index);
                        this.regex = new RegExp(stringKey.slice(index + 1, stringKey.length - 1));
                    }
                }
                else {
                    this.type = RouterKeyType.Path;
                    this.key = stringKey;
                }
            }

            match(path: string) {
                switch (this.type) {
                    case RouterKeyType.Wildcard:
                        return true;
                    case RouterKeyType.Param:
                        if (path != undefined) {
                            if (this.regex != undefined) {
                                return this.regex.test(path);
                            } else {
                                return true;
                            }
                        }
                        return false;
                    case RouterKeyType.Path:
                        if (path != undefined) {
                            return path == this.key;
                        }
                        return false;
                    default:
                        return false;
                }
            }
        }

        export class MethodRouter extends Kanro.Executors.BaseExecutor implements Kanro.Executors.IRequestDiverter {
            async shunt(request: Kanro.Http.IRequest, executors: Kanro.Containers.IExecutorContainer[]): Promise<Kanro.Containers.IExecutorContainer> {
                let method = request.method.toUpperCase();

                if (this.methods[method] != undefined) {
                    return this.methods[method];
                }

                throw new Kanro.Exceptions.KanroMethodNotAllowedException();
            }

            type: Kanro.Executors.ExecutorType.RequestDiverter = Kanro.Executors.ExecutorType.RequestDiverter;
            dependencies: { [name: string]: Kanro.Executors.IService; } = {};
            name: string = "MethodRouter";

            methods: { [method: string]: Kanro.Containers.IExecutorContainer } = {};

            constructor(config: Kanro.Containers.IRequestDiverterContainer) {
                super(config);

                config.next = [];

                for (var key in config) {
                    switch (key.toUpperCase()) {
                        case "OPTIONS":
                        case "GET":
                        case "HEAD":
                        case "POST":
                        case "PUT":
                        case "DELETE":
                        case "TRACE":
                        case "CONNECT":
                        case "PATCH":
                            this.methods[key.toUpperCase()] = config[key];
                            config.next.push(config[key]);
                            break;
                        default:
                            if (key.startsWith("-")) {
                                this.methods[key.slice(1).toUpperCase()] = config[key];
                                config.next.push(config[key]);
                            }
                            break;
                    }
                }
            }
        }
    }

    export namespace Http {
        /**
         * HTTP header structure.
         * 
         * @export
         * @interface IHttpHeader
         */
        export interface IHttpHeader {
            [name: string]: string;
        }

        /**
         * HTTP param structure.
         * 
         * @export
         * @interface IHttpParam
         */
        export interface IHttpParam {
            [name: string]: any;
        }

        /**
         * Url query structure.
         * 
         * @export
         * @interface IUrlQuery
         */
        export interface IUrlQuery {
            [name: string]: any;
        }

        /**
         * A HTTP request.
         * 
         * @export
         * @interface IRequest
         */
        export interface IRequest {
            /**
             * Meta data of request.
             * 
             * @type {Web.IncomingMessage}
             * @memberOf IRequest
             */
            meta: Web.IncomingMessage;
            /**
             * Header information of request.
             * 
             * @type {IHttpHeader}
             * @memberOf IRequest
             */
            header: IHttpHeader;
            /**
             * Url query information of request.
             * 
             * @type {IUrlQuery}
             * @memberOf IRequest
             */
            query: IUrlQuery;
            /**
             * Url of request, only include the path.
             * 
             * @type {string}
             * @memberOf IRequest
             */
            url: string;
            /**
             * Method of HTTP request, 'GET', 'POST' or other something.
             * 
             * @type {string}
             * @memberOf IRequest
             */
            method: string;
            /**
             * Param of HTTP, router url param, body parser result can be stored here.
             * 
             * @type {IHttpParam}
             * @memberOf IRequest
             */
            param: IHttpParam;

            /**
             * Executors which have handled this request, it is very useful for debug.
             * 
             * @type {Config.IExecutorConfig[]}
             * @memberOf IRequest
             */
            traceStack: Containers.IExecutorContainer[];

            /**
             * Copy a request, but the copy of this request will not include meta information.
             * 
             * @returns {IRequest} 
             * 
             * @memberOf IRequest
             */
            fork(): IRequest;
            /**
             * Convert this request to a response.
             * 
             * @returns {IResponse} 
             * 
             * @memberOf IRequest
             */
            respond(): IResponse;
        }

        /**
         * A HTTP response.
         * 
         * @export
         * @interface IResponse
         */
        export interface IResponse {
            /**
             * Meta data of response.
             * 
             * @type {Web.ServerResponse}
             * @memberOf IResponse
             */
            meta: Web.ServerResponse;
            /**
             * Request information.
             * 
             * @type {IRequest}
             * @memberOf IResponse
             */
            request: IRequest;
            /**
             * Header information of response.
             * 
             * @type {IHttpHeader}
             * @memberOf IResponse
             */
            header: IHttpHeader;
            /**
             * Body of response.
             * 
             * @type {IResponseBody}
             * @memberOf IResponse
             */
            body: IResponseBody;
            /**
             * Status code of response.
             * 
             * @type {number}
             * @memberOf IResponse
             */
            status: number;
            /**
             * Executors which have handled this request, it is very useful for debug, it will sync with 'request.traceStack'.
             * 
             * @type {Config.IExecutorConfig[]}
             * @memberOf IResponse
             */
            traceStack: Containers.IExecutorContainer[];
        }

        /**
         * Body of HTTP response.
         * 
         * @export
         * @interface IResponseBody
         */
        export interface IResponseBody {
            /**
             * Write data to response.
             * 
             * @param {Web.ServerResponse} response 
             * @returns {Promise<any>} 
             * 
             * @memberOf IResponseBody
             */
            write(response: Web.ServerResponse): Promise<any>;
        }

        /**
        * Json response body, it will return a object as json to client.
        * 
        * @export
        * @class JsonResponseBody
        * @implements {IResponseBody}
        */
        export class JsonResponseBody implements IResponseBody {
            data: any;
            /**
             * Write object as json to response.
             * 
             * @param {Web.ServerResponse} response 
             * @returns {Promise<any>} 
             * 
             * @memberOf JsonResponseBody
             */
            async write(response: Web.ServerResponse): Promise<any> {
                response.setHeader("Content-type", "application/json");
                await new Promise((res, rej) => {
                    response.write(JSON.stringify(this.data), () => {
                        res();
                    })
                })
            }

            /**
             * Creates an instance of JsonResponseBody.
             * @param {*} data Body object.
             * 
             * @memberOf JsonResponseBody
             */
            constructor(data: any) {
                this.data = data;
            }
        }

        export class FileResponseBody implements IResponseBody {
            path: string;

            async write(response: Web.ServerResponse): Promise<any> {
                let ext = IO.Path.extname(this.path);

                if (ext) {
                    response.setHeader("content-type", MimeType.contentType(ext));
                }
                else {
                    let buffer = await ReadChunk(this.path, 0, 4100);
                    response.setHeader("content-type", FileType(buffer).mime);
                }

                FileCore.createReadStream(this.path).pipe(response);
            }

            constructor(path: string) {
                this.path = path;
            }
        }

        export class RequestMirror implements IRequest {
            param: IHttpParam;
            meta: Web.IncomingMessage;
            header: IHttpHeader;
            query: IUrlQuery;
            url: string;
            method: string;
            $response: Response;
            traceStack: Containers.IExecutorContainer[];

            routerKey: string[];
            routerIndex: number;

            fork(): IRequest {
                return new RequestMirror(this);
            }
            respond(): IResponse {
                if (this.$response == undefined) {
                    this.$response = new Response(this);
                }

                return this.$response;
            }

            constructor(request: IRequest) {
                for (var key in request) {
                    if (key.startsWith("$") || key == "meta" || typeof request[key] == "function") {
                        break;
                    }

                    this[key] = Utils.ObjectUtils.copy(request[key]);
                }

                this.traceStack = [].concat(request.traceStack);
            }
        }

        export class Request implements IRequest {
            fork(): IRequest {
                return new RequestMirror(this);
            }
            respond(): IResponse {
                if (this.$response == undefined) {
                    this.$response = new Response(this);
                }

                return this.$response;
            }

            param: IHttpParam;
            meta: Web.IncomingMessage;
            header: IHttpHeader;
            query: IUrlQuery;
            url: string;
            method: string;
            traceStack: Containers.IExecutorContainer[];

            routerKey: string[];
            routerIndex: number;

            $responseMeta: Web.ServerResponse;
            $response: Response;

            constructor(httpRequest: Web.IncomingMessage, httpResponse: Web.ServerResponse) {
                this.meta = httpRequest;
                this.$responseMeta = httpResponse;

                let url = Url.parse(httpRequest.url);
                this.query = QueryString.parse(url.query);
                this.url = url.pathname;

                let skipStart = url.pathname.startsWith("/") ? 1 : 0;
                let skipEnd = url.pathname.endsWith("/") ? 1 : 0;
                let formattedUrl = url.pathname.slice(skipStart, url.pathname.length - skipStart - skipEnd + 1);
                this.routerKey = formattedUrl == "" ? [] : url.pathname.slice(skipStart, url.pathname.length - skipStart - skipEnd + 1).split("/");
                this.routerIndex = 0;

                this.header = Utils.ObjectUtils.copy(httpRequest.headers);
                this.method = httpRequest.method;

                this.param = {};
                this.traceStack = [];
            }
        }

        export class Response implements IResponse {
            meta: Web.ServerResponse;
            request: IRequest;
            header: IHttpHeader;
            body: IResponseBody;
            status: number;
            traceStack: Containers.IExecutorContainer[];

            constructor(request: IRequest) {
                this.meta = request["$responseMeta"];
                this.request = request;
                this.status = 200;
                this.traceStack = request.traceStack;
            }
        }
    }

    export namespace Exceptions {
        export class KanroException extends Error {
            public name: string = "Error.Kanro";
            public message: string;
            public innerException: Error;

            constructor(message: string, innerException: Error = undefined) {
                super(message);
                this.message = message;
                this.innerException = innerException;
            }
        }

        export class KanroHttpException extends KanroException {
            public name: string = "Error.Kanro.Http";
            public status: number = undefined;

            constructor(status: number, message: string, innerException: Error = undefined) {
                super(message, innerException);
                this.status = status;
            }
        }

        export class KanroBadRequestException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.BadRequest";

            constructor(message: string = "Bad Request", innerException: Error = undefined) {
                super(400, message, innerException);
            }
        }

        export class KanroUnauthorizedException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.Unauthorized";

            constructor(message: string = "Unauthorized", innerException: Error = undefined) {
                super(401, message, innerException);
            }
        }

        export class KanroForbiddenException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.Forbidden";

            constructor(message: string = "Forbidden", innerException: Error = undefined) {
                super(403, message, innerException);
            }
        }

        export class KanroNotFoundException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.NotFound";

            constructor(message: string = "Not Found", innerException: Error = undefined) {
                super(404, message, innerException);
            }
        }

        export class KanroMethodNotAllowedException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.MethodNotAllowed";

            constructor(message: string = "Bad Request", innerException: Error = undefined) {
                super(405, message, innerException);
            }
        }

        export class KanroNotAcceptableException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.NotAcceptable";

            constructor(message: string = "Not Acceptable", innerException: Error = undefined) {
                super(406, message, innerException);
            }
        }

        export class KanroProxyAuthenticationRequiredException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.ProxyAuthenticationRequired";

            constructor(message: string = "Proxy Authentication Required", innerException: Error = undefined) {
                super(407, message, innerException);
            }
        }

        export class KanroRequestTimeoutException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.RequestTimeout";

            constructor(message: string = "Request Timeout", innerException: Error = undefined) {
                super(408, message, innerException);
            }
        }

        export class KanroConflictException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.Conflict";

            constructor(message: string = "Conflict", innerException: Error = undefined) {
                super(409, message, innerException);
            }
        }

        export class KanroGoneException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.Gone";

            constructor(message: string = "Gone", innerException: Error = undefined) {
                super(410, message, innerException);
            }
        }

        export class KanroInternalServerErrorException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.InternalServerError";

            constructor(message: string = "Internal Server Error", innerException: Error = undefined) {
                super(500, message, innerException);
            }
        }

        export class KanroNotImplementedException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.NotImplemented";

            constructor(message: string = "Not Implemented", innerException: Error = undefined) {
                super(501, message, innerException);
            }
        }

        export class KanroBadGatewayException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.BadGateway";

            constructor(message: string = "Bad Gateway", innerException: Error = undefined) {
                super(502, message, innerException);
            }
        }

        export class KanroServiceUnavailableException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.ServiceUnavailable";

            constructor(message: string = "Service Unavailable", innerException: Error = undefined) {
                super(503, message, innerException);
            }
        }

        export class KanroGatewayTimeoutException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.GatewayTimeout";

            constructor(message: string = "Gateway Timeout", innerException: Error = undefined) {
                super(504, message, innerException);
            }
        }

        export class KanroVersionNotSupportedException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.VersionNotSupported";

            constructor(message: string = "HTTP Version Not Supported", innerException: Error = undefined) {
                super(505, message, innerException);
            }
        }

        export class KanroInsufficientStorageException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.InsufficientStorage";

            constructor(message: string = "Insufficient Storage", innerException: Error = undefined) {
                super(507, message, innerException);
            }
        }

        export class KanroBandwidthLimitExceededException extends KanroHttpException {
            public name: string = "Error.Kanro.Http.BandwidthLimitExceeded";

            constructor(message: string = "Bandwidth Limit Exceeded", innerException: Error = undefined) {
                super(509, message, innerException);
            }
        }

        export class KanroInvalidModuleException extends KanroException {
            public name: string = "Error.Kanro.Module.Invalid";
            public module = undefined;

            constructor(module: any, message: string = "Invalid Kanro module.", innerException: Error = undefined) {
                super(message, innerException);
                if (module == undefined) {
                    this.message = "Kanro module not found";
                }
                this.module = module;
            }
        }

        export class KanroInvalidExecutorException extends KanroException {
            public name: string = "Error.Kanro.Executor.Invalid";
            public executor = undefined;

            constructor(executor: any, message: string = "Invalid Kanro executor.", innerException: Error = undefined) {
                super(message, innerException);
                if (module == undefined) {
                    this.message = "Kanro executor not found";
                }
                this.executor = executor;
            }
        }

        export class ExceptionHelper {
            public static throwIfInvalidModule(module: Core.IModule) {
                if (!Utils.TypeUtils.isValidKanroModule(module)) {
                    throw new KanroInvalidModuleException(module);
                }
            }

            public static throwIfInvalidExecutor(executor: Executors.IExecutor) {
                if (!Utils.TypeUtils.isValidExecutor(executor)) {
                    throw new KanroInvalidExecutorException(executor);
                }
            }
        }

        export class KanroInvalidConfigException extends Kanro.Exceptions.KanroException {
            name: string = "Error.Kanro.Config.Invalid";

            constructor(config: string, message: string = undefined, innerException: Error = undefined) {
                super(`Config '${config}' not matched with schema, check your config file${message == undefined ? "" : `, message: '${message}'`}.`, innerException);
            }
        }

        export class KanroArgumentException extends Kanro.Exceptions.KanroException {
            name: string = "Error.Kanro.Argument";
            paramName: string;

            constructor(message: string, paramName: string, innerException: Error = undefined) {
                super(message, innerException);
                paramName = paramName;
            }
        }

        export class KanroArgumentNullException extends KanroArgumentException {
            name: string = "Error.Kanro.Argument.Null";

            constructor(paramName: string, innerException: Error = undefined) {
                super(`'${paramName}' cannot be null or undefined.`, paramName, innerException);
            }
        }

        export class KanroArgumentOutOfRangeException extends KanroArgumentException {
            name: string = "Error.Kanro.Argument.OutOfRange";

            constructor(paramName: string, innerException: Error = undefined) {
                super(`'${paramName}' is outside the allowable range.`, paramName, innerException);
            }
        }

        export class KanroArgumentTypeNotMatchedException extends KanroArgumentOutOfRangeException {
            name: string = "Error.Kanro.Argument.TypeNotMatched";

            constructor(paramName: string, type: string, innerException: Error = undefined) {
                super(paramName, innerException);
                this.message = `Type of '${paramName}' is not matched of '${type}'.`;
            }
        }
    }

    export namespace Log {
        export interface ILogger {
            success(message: string);
            error(message: string);
            info(message: string);
        }

        export class LoggerFactory {
            static buildLogger(key: string): ILogger {
                return new Logger(key);
            }
        }

        class Logger implements ILogger {
            private static debug = Debug;
            private static debugInitialized: boolean = false;
            private static namespaceCount: number = 0;
            private static namespaceColor: { [name: string]: number } = {};
            private static Colors = [0x3, 0x4, 0x5, 0x6, 0x1, 0x2, 0x7];
            private static selectColor(namespace: string) {
                if (Logger.namespaceColor[namespace] === undefined) {
                    Logger.namespaceColor[namespace] = Logger.namespaceCount;
                    Logger.namespaceCount++;
                }
                return Logger.Colors[Logger.namespaceColor[namespace] % Logger.Colors.length];
            }

            private debugger: Debug.IDebugger;

            constructor(namespace: string) {
                if (!Logger.debugInitialized) {
                    Logger.debug["colors"] = [0x3, 0x4, 0x5, 0x6, 0x1, 0x2, 0x7];
                    Logger.debug["formatArgs"] = function (args) {
                        var name = this.namespace;
                        var useColors = this.useColors;

                        if (args[1] === undefined) {
                            args[1] = LoggerLevel.Info;
                        }

                        var c: number = Logger.selectColor(name);
                        var prefix = '  \u001b[3' + c + 'm' + Utils.StringUtils.rightPad(name, 16, ' ') + '- ' + '\u001b[0m';
                        let levelPrefix: string;

                        switch (args[1]) {
                            case LoggerLevel.Success:
                                levelPrefix = '\u001b[32m' + '[+] ' + '\u001b[0m';
                                break;
                            case LoggerLevel.Error:
                                levelPrefix = '\u001b[31m' + '[x] ' + '\u001b[0m';
                                break;
                            default:
                                levelPrefix = '\u001b[37m' + '[!] ' + '\u001b[0m';
                                break;
                        }

                        args.pop();
                        args[0] = prefix + levelPrefix + args[0].split('\n').join('\n' + prefix);
                        args.push('\u001b[3' + c + 'm+' + Logger.debug["humanize"](this.diff) + '\u001b[0m');
                    }
                }

                this.debugger = Logger.debug(namespace);
            }
            success(message: string) {
                this.debugger(message, LoggerLevel.Success);
            }
            error(message: string) {
                this.debugger(message, LoggerLevel.Error);
            }
            info(message: string) {
                this.debugger(message, LoggerLevel.Info);
            }

            static App = new Logger("Kanro:App");
            static Module = new Logger("Kanro:Module");
            static Http = new Logger("Kanro:HTTP");
            static NPM = new Logger("Kanro:NPM");
            static Config = new Logger("Kanro:Config");
            static Router = new Logger("Kanro:Router");
            static Service = new Logger("Kanro:Service");
        }

        enum LoggerLevel {
            Info, Success, Error
        }
    }

    export namespace Utils {
        export class TypeUtils {
            /**
             * Check a module is a valid Kanro module or not.
             * 
             * @static
             * @param {IModule} module 
             * @returns 
             * 
             * @memberOf TypeUtils
             */
            static isValidKanroModule(module: Core.IModule) {
                return module == undefined || module.getExecutor != undefined &&
                    typeof (module.getExecutor) == 'function' &&
                    module.executorInfos != undefined;
            }

            /**
             * Check a executor is a valid Kanro executor or not.
             * 
             * @static
             * @param {IExecutor} executor 
             * @returns 
             * 
             * @memberOf TypeUtils
             */
            static isValidExecutor(executor: Executors.IExecutor) {
                if (executor == undefined || executor.name == undefined || executor.type == undefined) {
                    return false;
                }

                switch (executor.type) {
                    case Executors.ExecutorType.RequestHandler:
                        let requestHandler = <Executors.IRequestHandler>executor;
                        return typeof (requestHandler.handler) == 'function';
                    case Executors.ExecutorType.RequestDiverter:
                        let requestDiverter = <Executors.IRequestDiverter>executor;
                        return typeof (requestDiverter.shunt) == 'function';
                    case Executors.ExecutorType.RequestReplicator:
                        let requestReplicator = <Executors.IRequestReplicator>executor;
                        return typeof (requestReplicator.copy) == 'function';
                    case Executors.ExecutorType.Responder:
                        let responder = <Executors.IResponder>executor;
                        return typeof (responder.respond) == 'function';
                    case Executors.ExecutorType.ResponseHandler:
                        let responseHandler = <Executors.IResponseHandler>executor;
                        return typeof (responseHandler.handler) == 'function';
                    case Executors.ExecutorType.ExceptionHandler:
                        let exceptionHandler = <Executors.IExceptionHandler>executor;
                        return typeof (exceptionHandler.handler) == 'function';
                    case Executors.ExecutorType.Fuse:
                        let fuse = <Executors.IFuse>executor;
                        return typeof (fuse.fusing) == 'function';
                    case Executors.ExecutorType.GlobalRequestHandler:
                        let globalRequestHandler = <Executors.IGlobalRequestHandler>executor;
                        return typeof (globalRequestHandler.handler) == 'function';
                    case Executors.ExecutorType.GlobalResponseHandler:
                        let globalResponseHandler = <Executors.IGlobalResponseHandler>executor;
                        return typeof (globalResponseHandler.handler) == 'function';
                    case Executors.ExecutorType.GlobalExceptionHandler:
                        let globalExceptionHandler = <Executors.IGlobalExceptionHandler>executor;
                        return typeof (globalExceptionHandler.handler) == 'function';
                    case Executors.ExecutorType.Service:
                        return true;
                    default:
                        return false;
                }
            }
        }

        export class ObjectUtils {
            static copy<T>(object: T): T {
                if (Array.isArray(object)) {
                    return <any>[].concat(object);
                }

                return { ... <any>object };
            }

            static isEmptyObject(obj) {
                return !Object.keys(obj).length;
            }
        }

        export class StringUtils {
            static pathSplit(path: string): string[] {
                let result: string[] = [];
                let current = "";
                if (!path.endsWith("/")) {
                    path += "/";
                }

                let regex = 0;
                for (let char of path) {
                    switch (char) {
                        case "/":
                            if (regex > 0) {
                                current += char;
                                break;
                            }
                            if (current != undefined && current != "") {
                                result.push(current);
                                current = "";
                            }
                            break;
                        case "{":
                            current += char;
                            regex++;
                            break;
                        case "}":
                            current += char;
                            regex--;
                            break;
                        default:
                            current += char;
                            break;
                    }
                }

                return result;
            }

            static rightPad(str, len, ch) {
                str = "" + str;
                ch = ("" + ch) || " ";
                let padLen = len - str.length;
                if (padLen <= 0) {
                    return str;
                } else {
                    return str + ch.repeat(padLen);
                }
            }

            static leftPad(str, len, ch) {
                str = "" + str;
                ch = ("" + ch) || " ";
                let padLen = len - str.length;
                if (padLen <= 0) {
                    return str;
                } else {
                    return ch.repeat(padLen) + str;
                }
            }
        }

        export class AsyncUtils {
            static async promise<T>(func: Function, thisArg: any = undefined, ...args: any[]): Promise<T> {
                return new Promise<T>((res, rej) => {
                    let callback = function () {
                        let result = undefined;

                        for (let index in arguments) {
                            if (arguments[index] != undefined) {
                                if (typeof arguments[index].stack == "string") {
                                    rej(arguments[index]);
                                    return;
                                } else {
                                    if (result == undefined) {
                                        result = {};
                                    }
                                    result[index] = arguments[index];
                                }
                            }
                        }

                        if (Object.keys(result).length == 1) {
                            result = result[Object.keys(result)[0]];
                        }

                        res(result);
                    }

                    if (args == undefined) {
                        args = [];
                    }
                    args.push(callback);

                    func.call(thisArg, ...args);
                });
            }
        }
    }

    export namespace IO {
        export class File {
            static async unlink(path: string | Buffer): Promise<void> {
                return await Utils.AsyncUtils.promise<void>(FileCore.unlink, undefined, path);
            }

            static async exists(path: string | Buffer): Promise<boolean> {
                return await Utils.AsyncUtils.promise<boolean>(FileCore.exists, undefined, path);
            }

            static async rename(oldPath: string, newPath: string): Promise<boolean> {
                return await Utils.AsyncUtils.promise<boolean>(FileCore.rename, undefined, oldPath, newPath);
            }

            static async readJson(path: string): Promise<object> {
                let data = await Utils.AsyncUtils.promise<Buffer>(FileCore.readFile, undefined, path);
                return JSON.parse(data.toString());
            }

            static async readFile(path: string): Promise<Buffer> {
                return await Utils.AsyncUtils.promise<Buffer>(FileCore.readFile, undefined, path);
            }

            static async readdir(path: string): Promise<string[]> {
                return await Utils.AsyncUtils.promise<string[]>(FileCore.readdir, undefined, path);
            }
        }

        export const Path = PathCore;
    }
}