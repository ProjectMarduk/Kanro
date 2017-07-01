
import * as Npm from 'npm';

import { Path, File } from "./IO";
import { Node, Service, INodeContainer, Module, IModuleInfo } from "./Core";
import { KanroModule } from "./KanroModule";
import { NpmClient } from "./NpmClient";
import { ExceptionUtils, ObjectUtils } from "./Utils";
import { LoggerManager } from "./LoggerManager";
import { Colors } from "./Logging";
import { IAppConfig } from "./IAppConfig";

let moduleLogger = LoggerManager.current.registerLogger("Kanro:Module", Colors.blue);

export class ModuleManager {
    modules: { [name: string]: { [version: string]: Module } } = {};

    registerModule(name: string, version: string, module: Module) {
        ExceptionUtils.throwIfInvalidModule(module);

        if (name == 'kanro' && !(module instanceof KanroModule)) {
            moduleLogger.error(`Try to register a named 'kanro' module, but it is not 'kanro' module.`);
            throw new Error();
        }

        if (ObjectUtils.getValueFormKeys(this.modules, name, version) != undefined) {
            moduleLogger.warning(`Try to overwrite a registered module '${name}@${version}'.`);
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
            moduleLogger.warning(`Try to install a unspecific version module '${name}', but not a kanro core module.`);
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
                moduleLogger.warning(`Local module '${name}' is not a valid kanro module, try to reinstall it.`);
            }
        } catch (error) {

        }

        // Try to install module by NPM.
        try {
            module = await NpmClient.install(name, version);
            this.registerModule(name, version, result['KanroModule']);
            result = module['KanroModule'];
            moduleLogger.success(`Module '${name}@${version}' has been installed success!`);
            return result;
        } catch (error) {
            moduleLogger.warning(`Install module '${name}@${version}' fail! Message: '${error.message}'.`);
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
        let result = await module.getNode(config);

        try {
            ExceptionUtils.throwIfInvalidNode(result);
        } catch (error) {
            moduleLogger.error(`Node '${config.module.name}@${config.module.version}:${config.name}' is a invalid Kanro module.`);
            throw error;
        }

        config.instance = result;
        return result;
    }

    private constructor() {

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

        if (node.next instanceof Array) {
            for (let nextNode of node.next) {
                result += await this.installMissedModule(nextNode);
            }
        }
        else {
            result += await this.installMissedModule(node.next);
        }
    }

    private async fillNodeInstance(node: INodeContainer<Node>): Promise<boolean> {
        let result = true;

        if (node == undefined) {
            return result;
        }

        if (node.instance == undefined) {
            node.instance = await this.getNode(node);
            result = result && (node.instance != undefined);

            if (!result) {
                return result;
            }
            else {
                try {
                    await node.instance.onLoaded();
                } catch (error) {
                    //TODO:
                    throw new Error("A exception has been threw by 'node.onLoaded' event.");
                }
            }
        }

        if (node.dependencies != undefined) {
            for (let key in node.dependencies) {
                result = result && await this.fillNodeInstance(node.dependencies[key]);

                if (node.dependencies[key].instance != undefined) {
                    node.instance.dependencies[key] = node.dependencies[key].instance;
                }
            }
        }

        if (ObjectUtils.getValueFormKeys(node, 'instance', 'dependencies') != undefined) {
            for (let key in node.instance.dependencies) {
                let serviceInfo = node.instance.dependencies[key];

                if (!(serviceInfo instanceof Service)) {
                    let serviceConfig: INodeContainer<Service> = {
                        name: key,
                        module: serviceInfo
                    }

                    let service = await this.getNode(serviceConfig);

                    if (service != undefined) {
                        node.instance.dependencies[key] = service;
                    }
                }
            }

            let dependenciesFilled = true;

            for (let key in node.instance.dependencies) {
                let serviceInfo = node.instance.dependencies[key];

                if (!(serviceInfo instanceof Service)) {
                    dependenciesFilled = false;
                    break;
                }
            }

            if (dependenciesFilled) {
                try {
                    await node.instance.onDependenciesFilled();
                } catch (error) {
                    //TODO:
                    throw new Error("A exception has been threw by 'node.onLoaded' event.");
                }
            }
        }

        if (node.exceptionHandlers != undefined) {
            for (let exceptionHandler of node.exceptionHandlers) {
                result = result && await this.fillNodeInstance(exceptionHandler);
            }
        }

        if (node.fuses != undefined) {
            for (let fuse of node.fuses) {
                result = result && await this.fillNodeInstance(fuse);
            }
        }

        if (node.next != undefined) {
            if (node.next instanceof Array) {
                for (let nextNode of node.next) {
                    result = result && await this.fillNodeInstance(nextNode);
                }
            }
            else {
                result = result && await this.fillNodeInstance(node.next);
            }
        }

        return result;
    }

    async loadConfig(config: IAppConfig) {
        let missedModule = 0;
        let allNodeFilled = true;

        do {
            missedModule = 0;
            allNodeFilled = true;

            missedModule += await this.installMissedModule(config.entryPoint);
            missedModule += await this.installMissedModule(config.exitPoint);

            allNodeFilled = allNodeFilled && await this.fillNodeInstance(config.entryPoint);
            allNodeFilled = allNodeFilled && await this.fillNodeInstance(config.exitPoint);
        } while ((missedModule == 0) && allNodeFilled);
    }

    static async initialize(config: IAppConfig): Promise<ModuleManager> {
        if (ModuleManager.instance != undefined) {
            return ModuleManager.instance;
        }

        let result = new ModuleManager();

        await NpmClient.initialize(config);
        ModuleManager.instance = result;
        return result;
    }
}