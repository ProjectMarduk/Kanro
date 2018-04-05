import * as Cluster from "cluster";
import * as Npm from "npm";
import { AnsiStyle, Colors, ILogger } from "./Logging";
import { Application } from ".";
import { ConfigBuilder } from "./ConfigBuilder";
import { ExceptionUtils, ObjectUtils } from "./Utils";
import { File, Path } from "./IO";
import { HttpServer } from "./HttpServer";
import { IAppConfig } from "./IAppConfig";
import { IModuleInfo, INodeContainer, Module, Node, Service } from "./Core";
import { KanroException } from "./Exceptions/index";
import { KanroInternalModule } from "./KanroInternalModule";
import { KanroModule } from "./KanroModule";
import { LoggerManager } from "./LoggerManager";
import { NpmClient } from "./NpmClient";


export class ModuleManager extends Service {
    modules: { [name: string]: { [version: string]: Module } } = {};
    localModules: { [name: string]: { [version: string]: Module } } = {};
    service: { [name: string]: INodeContainer<Service> } = {};

    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        },
        npmClient: {
            name: NpmClient.name,
            module: KanroInternalModule.moduleInfo
        }
    };

    private moduleLogger: ILogger;

    constructor() {
        super(undefined);
    }

    private npmClient: NpmClient;

    readonly isProxable: boolean = false;

    async onLoaded(): Promise<void> {
        this.npmClient = await this.getDependedService<NpmClient>("npmClient");
        this.moduleLogger = await (await this.getDependedService<LoggerManager>("loggerManager"))
            .registerLogger("Module", AnsiStyle.create().foreground(Colors.blue));
    }

    registerLocalModule(name: string, version: string, module: Module): void {
        ExceptionUtils.throwIfInvalidModule(module);

        this.registerModule(name, version, module);
        ObjectUtils.setValueFormKeys(this.localModules, module, name, version);
    }

    private registerModule(name: string, version: string, module: Module): void {
        ExceptionUtils.throwIfInvalidModule(module);

        if (name === "kanro" && !(module instanceof KanroModule)) {
            this.moduleLogger.error(`Try to register a named 'kanro' module, but it is not 'kanro' module.`);
            throw new Error();
        }

        if (ObjectUtils.getValueFormKeys(this.modules, name, version) != null) {
            this.moduleLogger.warning(`Try to overwrite a registered module '${name}@${version}'.`);
        }

        ObjectUtils.setValueFormKeys(this.modules, module, name, version);
    }

    async installModule(name: string, version: string = "*"): Promise<Module> {
        let result: Module;
        name = name.toLowerCase();

        // try to find it in cache.
        result = this.getModule(name, version);

        if (result != null) {
            return result;
        }

        if (version === "*" && name !== "kanro") {
            this.moduleLogger.warning(`Try to install a unspecific version module '${name}', but not a kanro core module.`);
        }

        let module: any;
        // try to require local module.
        try {
            if (version === "*") {
                module = require(name);
            } else {
                module = require(`.${version}@${name}`);
            }

            // try to register local module.
            try {
                this.registerModule(name, version, module.KanroModule);
                return module.KanroModule;
            } catch (error) {
                this.moduleLogger.warning(`Local module '${name}' is not a valid kanro module, try to reinstall it.`);
            }
        } catch (error) {
            // ignored
        }

        // try to install module by NPM.
        try {
            module = await this.npmClient.install(name, version);
            this.registerModule(name, version, module.KanroModule);
            result = module.KanroModule;
            this.moduleLogger.success(`Module '${name}@${version}' has been installed success!`);
            return result;
        } catch (error) {
            this.moduleLogger.warning(`Install module '${name}@${version}' fail! Message: '${error.message}'.`);
            throw error;
        }
    }

    getModule(name: string, version: string): Module {
        if (version === "*") {
            if (this.modules[name] != null) {
                for (let key in this.modules[name]) {
                    if (this.modules[name].hasOwnProperty(key)) {
                        return this.modules[name][key];
                    }
                }
            }

            return undefined;
        }

        if (this.modules[name] != null) {
            return this.modules[name][version];
        }

        return undefined;
    }

    isModuleInstalled(name: string, version: string): boolean {
        let result: Module = this.getModule(name, version);
        return result != null;
    }

    async getNode(config: INodeContainer<Node>): Promise<Node> {
        let module: Module = this.getModule(config.module.name, config.module.version);
        if (module == null && Cluster.isMaster) {
            await this.installModule(config.module.name, config.module.version);
            module = this.getModule(config.module.name, config.module.version);
        }
        if (module == null) {
            let message: string = `Module '${config.module.name}@${config.module.version}' not found.`;
            this.moduleLogger.error(message);
            throw new Error(message);
        }
        let result: Node = await module.getNode(config);

        try {
            ExceptionUtils.throwIfInvalidNode(result);
        } catch (error) {
            this.moduleLogger.error(`Node '${config.module.name}@${config.module.version}:${config.name}' is a invalid Kanro module.`);
            throw error;
        }

        config.instance = result;
        return result;
    }

    async registerService(config: INodeContainer<Service>, registerContext?: { count: number }): Promise<INodeContainer<Service>> {
        let serviceKey: string = `${config.module.name}@${config.module.version}:${config.name}`;
        if (config.id != null) {
            serviceKey = `${serviceKey}@${config.id}`;
        }

        if (this.service[serviceKey] == null) {
            config.instance = <Service>await this.getNode(config);
            this.service[serviceKey] = config;
            if (registerContext != null) {
                registerContext.count++;
            }
        } else {
            if (config.dependencies != null) {
                for (const key in config.dependencies) {
                    if (config.dependencies.hasOwnProperty(key)) {
                        this.service[serviceKey].dependencies[key] = config.dependencies[key];
                    }
                }
            }
        }

        return this.service[serviceKey];
    }

    async getService(config: INodeContainer<Service>): Promise<INodeContainer<Service>> {
        let serviceKey: string = `${config.module.name}@${config.module.version}:${config.name}`;
        if (config.id != null) {
            serviceKey = `${serviceKey}@${config.id}`;
        }

        if (this.service[serviceKey] === undefined) {
            throw new KanroException(`Service '${serviceKey} can't be resolved.`);
        }

        return this.service[serviceKey];
    }

    private async installMissedModule(node: INodeContainer<Node>): Promise<number> {
        let result: number = 0;

        if (node === undefined) {
            return result;
        }

        if (node.dependencies != null) {
            for (let key in node.dependencies) {
                if (node.dependencies.hasOwnProperty(key)) {
                    result += await this.installMissedModule(node.dependencies[key]);
                }
            }
        }

        if (node.module != null) {
            if (this.getModule(node.module.name, node.module.version) == null) {
                await this.installModule(node.module.name, node.module.version);
                result++;
            }
        }

        if (node.exceptionHandlers != null) {
            for (let exceptionHandler of node.exceptionHandlers) {
                result += await this.installMissedModule(exceptionHandler);
            }
        }

        if (node.fuses != null) {
            for (let fuse of node.fuses) {
                result += await this.installMissedModule(fuse);
            }
        }

        if (node.next instanceof Array) {
            for (let nextNode of node.next) {
                result += await this.installMissedModule(nextNode);
            }
        } else {
            result += await this.installMissedModule(node.next);
        }
    }

    private async nodeLoadEvent(node: INodeContainer<Node>): Promise<void> {
        if (node === undefined) {
            return;
        }

        try {
            await node.instance.onLoaded();
        } catch (error) {
            throw new KanroException("A exception has been threw by 'node.onLoaded' event.", error);
        }

        if (node.exceptionHandlers != null) {
            for (let exceptionHandler of node.exceptionHandlers) {
                await this.nodeLoadEvent(exceptionHandler);
            }
        }

        if (node.fuses != null) {
            for (let fuse of node.fuses) {
                await this.nodeLoadEvent(fuse);
            }
        }

        if (node.next instanceof Array) {
            for (let nextNode of node.next) {
                await this.nodeLoadEvent(nextNode);
            }
        } else {
            await this.nodeLoadEvent(node.next);
        }
    }

    private async resolveRequiredServices(node: INodeContainer<Node>): Promise<void> {
        if (node === undefined) {
            return;
        }

        if (node.dependencies != null) {
            for (let key in node.dependencies) {
                if (node.dependencies.hasOwnProperty(key)) {
                    await this.registerService(node.dependencies[key]);
                }
            }
        }

        if (ObjectUtils.getValueFormKeys(node, "instance", "dependencies") != null) {
            for (let key in node.instance.dependencies) {
                if (node.instance.dependencies.hasOwnProperty(key)) {
                    let serviceInfo: Service | INodeContainer<Service> = node.instance.dependencies[key];

                    if (!(serviceInfo instanceof Service)) {
                        await this.registerService(serviceInfo);
                    } else {
                        await this.resolveRequiredServices({
                            name: "",
                            module: {
                                name: "",
                                version: ""
                            },
                            instance: serviceInfo
                        });
                    }
                }
            }
        }

        if (node.exceptionHandlers != null) {
            for (let exceptionHandler of node.exceptionHandlers) {
                await this.resolveRequiredServices(exceptionHandler);
            }
        }

        if (node.fuses != null) {
            for (let fuse of node.fuses) {
                await this.resolveRequiredServices(fuse);
            }
        }

        if (node.next != null) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    await this.resolveRequiredServices(nextNode);
                }
            } else {
                await this.resolveRequiredServices(node.next);
            }
        }
    }

    private async resolveAllDependedService(): Promise<void> {
        let result: number = 0;

        do {
            for (let key in this.service) {
                if (this.service.hasOwnProperty(key)) {
                    let serviceInfo: INodeContainer<Service> = this.service[key];
                    result += await this.resolveDependedService(this.service[key]);
                }
            }
        } while (result !== 0);

        for (const key in this.service) {
            if (this.service.hasOwnProperty(key)) {
                try {
                    await this.service[key].instance.onLoaded();
                } catch (error) {
                    throw new KanroException("A exception has been threw by 'node.onLoaded' event.", error);
                }
            }
        }
    }

    private async resolveDependedService(serviceInfo: INodeContainer<Service>): Promise<number> {
        let result: any = {
            count: 0
        };

        if (serviceInfo.instance === undefined) {
            throw new Error("A empty registered service.");
        }

        if (serviceInfo.dependencies != null) {
            for (const key in serviceInfo.dependencies) {
                if (serviceInfo.dependencies.hasOwnProperty(key)) {
                    let dependedServiceInfo: INodeContainer<Service> = serviceInfo.dependencies[key];
                    if (dependedServiceInfo.instance === undefined) {
                        dependedServiceInfo = await this.registerService(dependedServiceInfo, result);
                    }
                    serviceInfo.dependencies[key] = dependedServiceInfo;
                    serviceInfo.instance.dependencies[key] = dependedServiceInfo;
                }
            }
        }

        for (const key in serviceInfo.instance.dependencies) {
            if (serviceInfo.instance.dependencies.hasOwnProperty(key)) {
                let dependedServiceInfo: INodeContainer<Service> = serviceInfo.instance.dependencies[key];

                if (!(dependedServiceInfo instanceof Service)) {
                    if (dependedServiceInfo.instance === undefined) {
                        dependedServiceInfo = await this.registerService(dependedServiceInfo, result);
                    }
                    serviceInfo.instance.dependencies[key] = dependedServiceInfo;
                }
            }
        }

        return result.count;
    }

    private async resolveNode(node: INodeContainer<Node>): Promise<number> {
        let result: number = 0;

        if (node === undefined) {
            return result;
        }

        if (node.instance === undefined) {
            node.instance = await this.getNode(node);
            result++;

            if (!result) {
                return result;
            } else {
                try {
                    await node.instance.onCreated();
                } catch (error) {
                    throw new KanroException("A exception has been threw by 'node.onCreated' event.", error);
                }
            }
        }

        if (node.exceptionHandlers != null) {
            for (let exceptionHandler of node.exceptionHandlers) {
                result += await this.resolveNode(exceptionHandler);
            }
        }

        if (node.fuses != null) {
            for (let fuse of node.fuses) {
                result += await this.resolveNode(fuse);
            }
        }

        if (node.next != null) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    result += await this.resolveNode(nextNode);
                }
            } else {
                result += await this.resolveNode(node.next);
            }
        }

        return result;
    }

    private async resolveNodeDependencies(node: INodeContainer<Node>): Promise<void> {
        if (node === undefined) {
            return;
        }

        if (ObjectUtils.getValueFormKeys(node, "instance", "dependencies") != null) {
            for (let key in node.instance.dependencies) {
                if (node.instance.dependencies.hasOwnProperty(key)) {
                    let serviceInfo: INodeContainer<Service> | Service = node.instance.dependencies[key];

                    if (!(serviceInfo instanceof Service)) {
                        let serviceConfig: INodeContainer<Service> = serviceInfo;
                        serviceConfig = await this.getService(serviceConfig);
                        node.instance.dependencies[key] = serviceConfig;
                        // result += await this.fillNodeInstance(serviceConfig);
                    }
                }
            }
        }

        if (node.dependencies != null) {
            for (let key in node.dependencies) {
                if (node.dependencies.hasOwnProperty(key)) {
                    let serviceInfo: INodeContainer<Service> = await this.getService(node.dependencies[key]);
                    node.dependencies[key] = serviceInfo;
                    node.instance.dependencies[key] = serviceInfo;
                }
            }
        }

        if (node.exceptionHandlers != null) {
            for (let exceptionHandler of node.exceptionHandlers) {
                await this.resolveNodeDependencies(exceptionHandler);
            }
        }

        if (node.fuses != null) {
            for (let fuse of node.fuses) {
                await this.resolveNodeDependencies(fuse);
            }
        }

        if (node.next != null) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    await this.resolveNodeDependencies(nextNode);
                }
            } else {
                await this.resolveNodeDependencies(node.next);
            }
        }

    }

    async loadConfig(config: IAppConfig): Promise<void> {
        let missedModule: number = 0;
        let newNode: number = 0;

        if (Cluster.isMaster) {
            await this.npmClient.initialize(config);
        }

        await this.resolveNode(config.entryPoint);
        await this.resolveNode(config.exitPoint);

        await this.resolveRequiredServices(config.entryPoint);
        await this.resolveRequiredServices(config.exitPoint);

        await this.resolveAllDependedService();

        await this.resolveNodeDependencies(config.entryPoint);
        await this.resolveNodeDependencies(config.exitPoint);

        await this.nodeLoadEvent(config.entryPoint);
        await this.nodeLoadEvent(config.exitPoint);
    }

    async initialize(internalModule: KanroInternalModule): Promise<void> {
        if (internalModule.moduleManager !== this) {
            throw new KanroException("Unknown error for initialize internal kanro module");
        }

        this.registerLocalModule(KanroInternalModule.moduleInfo.name,
            KanroInternalModule.moduleInfo.version, internalModule);
        this.registerLocalModule(KanroModule.moduleInfo.name,
            KanroModule.moduleInfo.version, new KanroModule());

        await this.registerService({
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        });
        await this.registerService({
            name: Application.name,
            module: KanroInternalModule.moduleInfo
        });
        await this.registerService({
            name: NpmClient.name,
            module: KanroInternalModule.moduleInfo
        });
        await this.registerService({
            name: ConfigBuilder.name,
            module: KanroInternalModule.moduleInfo
        });
        await this.registerService({
            name: HttpServer.name,
            module: KanroInternalModule.moduleInfo
        });
        await this.registerService({
            name: ModuleManager.name,
            module: KanroInternalModule.moduleInfo
        });
        await this.resolveAllDependedService();
    }
}