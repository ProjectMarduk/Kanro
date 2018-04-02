import * as Npm from 'npm';
import * as Cluster from "cluster";

import { Path, File } from "./IO";
import { Node, Service, INodeContainer, Module, IModuleInfo } from "./Core";
import { KanroModule } from "./KanroModule";
import { NpmClient } from "./NpmClient";
import { ExceptionUtils, ObjectUtils } from "./Utils";
import { LoggerManager } from "./LoggerManager";
import { Colors, AnsiStyle, ILogger } from "./Logging";
import { IAppConfig } from "./IAppConfig";
import { KanroException } from "./Exceptions/index";
import { KanroInternalModule } from './KanroInternalModule';
import { Application } from '.';
import { ConfigBuilder } from './ConfigBuilder';
import { HttpServer } from './HttpServer';

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
    }

    private moduleLogger: ILogger;

    constructor() {
        super(undefined);
    }

    private get npmClient(): NpmClient {
        return <NpmClient><any>this.dependencies.npmClient;
    }

    public get isProxable() {
        return false;
    }

    async onLoaded(): Promise<void> {
        this.moduleLogger = this.getDependedService<LoggerManager>("loggerManager").registerLogger("Module", AnsiStyle.create().foreground(Colors.blue));
    }

    registerLocalModule(name: string, version: string, module: Module) {
        ExceptionUtils.throwIfInvalidModule(module);

        this.registerModule(name, version, module);
        ObjectUtils.setValueFormKeys(this.localModules, module, name, version);
    }

    private registerModule(name: string, version: string, module: Module) {
        ExceptionUtils.throwIfInvalidModule(module);

        if (name == 'kanro' && !(module instanceof KanroModule)) {
            this.moduleLogger.error(`Try to register a named 'kanro' module, but it is not 'kanro' module.`);
            throw new Error();
        }

        if (ObjectUtils.getValueFormKeys(this.modules, name, version) != undefined) {
            this.moduleLogger.warning(`Try to overwrite a registered module '${name}@${version}'.`);
        }

        ObjectUtils.setValueFormKeys(this.modules, module, name, version);
    }

    async installModule(name: string, version: string = '*'): Promise<Module> {
        let result: Module;
        name = name.toLowerCase();

        // Try to find it in cache.
        result = this.getModule(name, version);

        if (result != undefined) {
            return result;
        }

        if (version == '*' && name != 'kanro') {
            this.moduleLogger.warning(`Try to install a unspecific version module '${name}', but not a kanro core module.`);
        }

        let module;
        // Try to require local module.
        try {
            if (version == '*') {
                module = require(name);
            }
            else {
                module = require(`.${version}@${name}`);
            }

            // Try to register local module.
            try {
                this.registerModule(name, version, module['KanroModule']);
                return module['KanroModule'];
            } catch (error) {
                this.moduleLogger.warning(`Local module '${name}' is not a valid kanro module, try to reinstall it.`);
            }
        } catch (error) {

        }

        // Try to install module by NPM.
        try {
            module = await this.npmClient.install(name, version);
            this.registerModule(name, version, result['KanroModule']);
            result = module['KanroModule'];
            this.moduleLogger.success(`Module '${name}@${version}' has been installed success!`);
            return result;
        } catch (error) {
            this.moduleLogger.warning(`Install module '${name}@${version}' fail! Message: '${error.message}'.`);
            throw error;
        }
    }

    getModule(name: string, version: string): Module {
        if (version == '*') {
            if (this.modules[name] != undefined) {
                for (var key in this.modules[name]) {
                    return this.modules[name][key];
                }
            }

            return undefined;
        }

        if (this.modules[name] != undefined) {
            return this.modules[name][version];
        }

        return undefined;
    }

    isModuleInstalled(name: string, version: string): boolean {
        let result = this.getModule(name, version);
        return result != undefined;
    }

    async getNode(config: INodeContainer<Node>): Promise<Node> {
        let module = this.getModule(config.module.name, config.module.version);
        if (module == undefined && Cluster.isMaster) {
            await this.installModule(config.module.name, config.module.version);
            module = this.getModule(config.module.name, config.module.version);
        }
        if (module == undefined) {
            let message = `Module '${config.module.name}@${config.module.version}' not found.`;
            this.moduleLogger.error(message);
            throw new Error(message);
        }
        let result = await module.getNode(config);

        try {
            ExceptionUtils.throwIfInvalidNode(result);
        } catch (error) {
            this.moduleLogger.error(`Node '${config.module.name}@${config.module.version}:${config.name}' is a invalid Kanro module.`);
            throw error;
        }

        config.instance = result;
        return result;
    }

    async registerService(config: INodeContainer<Service>): Promise<INodeContainer<Service>> {
        let serviceKey = `${config.module.name}@${config.module.version}:${config.name}`;
        if (config["id"] != undefined) {
            serviceKey = `${serviceKey}@${config["id"]}`;
        }

        if (this.service[serviceKey] == undefined) {
            config.instance = <Service>await this.getNode(config);
            this.service[serviceKey] = config;
        }
        else {
            if (config.dependencies != undefined) {
                for (const key in config.dependencies) {
                    this.service[serviceKey].dependencies[key] = config.dependencies[key];
                }
            }
        }

        return this.service[serviceKey];
    }

    async getService(config: INodeContainer<Service>): Promise<INodeContainer<Service>> {
        let serviceKey = `${config.module.name}@${config.module.version}:${config.name}`;
        if (config["id"] != undefined) {
            serviceKey = `${serviceKey}@${config["id"]}`;
        }

        if (this.service[serviceKey] == undefined) {
            throw new KanroException(`Service '${serviceKey} can't be resolved.`);
        }

        return this.service[serviceKey];
    }

    private static instance: ModuleManager;
    public static get current() {
        return ModuleManager.instance;
    }

    private async installMissedModule(node: INodeContainer<Node>): Promise<number> {
        let result = 0;

        if (node == undefined) {
            return result;
        }

        if (node.dependencies != undefined) {
            for (let key in node.dependencies) {
                result += await this.installMissedModule(node.dependencies[key]);
            }
        }

        if (node.module != undefined) {
            if (this.getModule(node.module.name, node.module.version) == null) {
                await this.installModule(node.module.name, node.module.version);
                result++;
            }
        }

        if (node.exceptionHandlers != undefined) {
            for (let exceptionHandler of node.exceptionHandlers) {
                result += await this.installMissedModule(exceptionHandler);
            }
        }

        if (node.fuses != undefined) {
            for (let fuse of node.fuses) {
                result += await this.installMissedModule(fuse);
            }
        }

        if (node.next instanceof Array) {
            for (let nextNode of node.next) {
                result += await this.installMissedModule(nextNode);
            }
        }
        else {
            result += await this.installMissedModule(node.next);
        }
    }

    private async nodeLoadEvent(node: INodeContainer<Node>) {
        if (node == undefined) {
            return;
        }

        try {
            await node.instance.onLoaded()
        } catch (error) {
            throw new KanroException("A exception has been threw by 'node.onLoaded' event.", error);
        }

        if (node.exceptionHandlers != undefined) {
            for (let exceptionHandler of node.exceptionHandlers) {
                await this.nodeLoadEvent(exceptionHandler);
            }
        }

        if (node.fuses != undefined) {
            for (let fuse of node.fuses) {
                await this.nodeLoadEvent(fuse);
            }
        }

        if (node.next instanceof Array) {
            for (let nextNode of node.next) {
                await this.nodeLoadEvent(nextNode);
            }
        }
        else {
            await this.nodeLoadEvent(node.next);
        }
    }

    private async resolveRequiredServices(node: INodeContainer<Node>) {
        if (node == undefined) {
            return;
        }

        if (node.dependencies != undefined) {
            for (let key in node.dependencies) {
                node.dependencies[key] = await this.registerService(node.dependencies[key]);
            }
        }

        if (ObjectUtils.getValueFormKeys(node, 'instance', 'dependencies') != undefined) {
            for (let key in node.instance.dependencies) {
                let serviceInfo = node.instance.dependencies[key];

                if (!(serviceInfo instanceof Service)) {
                    node.instance.dependencies[key] = await this.registerService(serviceInfo);
                }
            }
        }

        if (node.exceptionHandlers != undefined) {
            for (let exceptionHandler of node.exceptionHandlers) {
                await this.resolveRequiredServices(exceptionHandler);
            }
        }

        if (node.fuses != undefined) {
            for (let fuse of node.fuses) {
                await this.resolveRequiredServices(fuse);
            }
        }

        if (node.next != undefined) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    await this.resolveRequiredServices(nextNode);
                }
            }
            else {
                await this.resolveRequiredServices(node.next);
            }
        }
    }

    private async resolveAllDependedService() {
        let result = 0;

        do {
            for (let key in this.service) {
                let serviceInfo = this.service[key];
                result += await this.resolveDependedService(this.service[key]);
            }
        } while (result != 0);

        for (const key in this.service) {
            try {
                await this.service[key].instance.onLoaded();
            } catch (error) {
                throw new KanroException("A exception has been threw by 'node.onLoaded' event.", error);
            }
        }
    }

    private async resolveDependedService(serviceInfo: INodeContainer<Service>): Promise<number> {
        let result = 0;

        if (serviceInfo.instance == undefined) {
            serviceInfo.instance = <Service>await this.getNode(serviceInfo);
            result++;
        }

        if (serviceInfo.dependencies != undefined) {
            for (const key in serviceInfo.dependencies) {
                let dependedServiceInfo = serviceInfo.dependencies[key];
                if (dependedServiceInfo.instance == undefined) {
                    dependedServiceInfo = await this.registerService(dependedServiceInfo);
                }
                serviceInfo.dependencies[key] = dependedServiceInfo;
                serviceInfo.instance.dependencies[key] = dependedServiceInfo.instance;
            }
        }

        for (const key in serviceInfo.instance.dependencies) {
            let dependedServiceInfo = serviceInfo.instance.dependencies[key];

            if (!(dependedServiceInfo instanceof Service)) {
                if (dependedServiceInfo.instance == undefined) {
                    dependedServiceInfo = await this.registerService(dependedServiceInfo);
                }
                serviceInfo.instance.dependencies[key] = dependedServiceInfo.instance;
            }
        }

        return result;
    }

    private async resolveNode(node: INodeContainer<Node>): Promise<number> {
        let result = 0;

        if (node == undefined) {
            return result;
        }

        if (node.instance == undefined) {
            node.instance = await this.getNode(node);
            result++;

            if (!result) {
                return result;
            }
            else {
                try {
                    await node.instance.onCreated();
                } catch (error) {
                    throw new KanroException("A exception has been threw by 'node.onCreated' event.", error);
                }
            }
        }

        if (node.exceptionHandlers != undefined) {
            for (let exceptionHandler of node.exceptionHandlers) {
                result += await this.resolveNode(exceptionHandler);
            }
        }

        if (node.fuses != undefined) {
            for (let fuse of node.fuses) {
                result += await this.resolveNode(fuse);
            }
        }

        if (node.next != undefined) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    result += await this.resolveNode(nextNode);
                }
            }
            else {
                result += await this.resolveNode(node.next);
            }
        }

        return result;
    }

    private async resolveNodeDependencies(node: INodeContainer<Node>){
        if (node == undefined) {
            return;
        }

        if (ObjectUtils.getValueFormKeys(node, 'instance', 'dependencies') != undefined) {
            for (let key in node.instance.dependencies) {
                let serviceInfo = node.instance.dependencies[key];

                if (!(serviceInfo instanceof Service)) {
                    let serviceConfig: INodeContainer<Service> = serviceInfo;
                    serviceConfig = await this.getService(serviceConfig);
                    node.instance.dependencies[key] = serviceConfig.instance;
                    //result += await this.fillNodeInstance(serviceConfig);
                }
            }
        }

        if (node.dependencies != undefined) {
            for (let key in node.dependencies) {
                let serviceInfo = await this.getService(node.dependencies[key]);
                node.dependencies[key] = serviceInfo;
                node.instance.dependencies[key] = serviceInfo.instance;
            }
        }

        if (node.exceptionHandlers != undefined) {
            for (let exceptionHandler of node.exceptionHandlers) {
                await this.resolveNodeDependencies(exceptionHandler);
            }
        }

        if (node.fuses != undefined) {
            for (let fuse of node.fuses) {
                await this.resolveNodeDependencies(fuse);
            }
        }

        if (node.next != undefined) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    await this.resolveNodeDependencies(nextNode);
                }
            }
            else {
                await this.resolveNodeDependencies(node.next);
            }
        }

    }

    async loadConfig(config: IAppConfig) {
        let missedModule = 0;
        let newNode = 0;

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
        if (internalModule.moduleManager != this) {
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