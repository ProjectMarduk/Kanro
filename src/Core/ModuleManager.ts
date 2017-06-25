
import * as Npm from 'npm';

import { ExecutorType, IService, IExecutor } from "../Executors";
import { Path, File } from "../IO";
import { ExceptionUtils } from "../Utils/ExceptionUtils";
import { IExecutorContainer } from "../Containers";
import { IModuleManager } from "./IModuleManager";
import { IModule } from "./IModule";
import { IApplicationContext } from "./IApplicationContext";
import { IModuleInfo } from "./IModuleInfo";
import { KanroModule } from "./KanroModule";

export class ModuleManager implements IModuleManager {
    type: ExecutorType.Service = ExecutorType.Service;
    services: { [name: string]: IService; } = {};
    name: string = "ModuleManager";
    modules: { [name: string]: IModule };
    modulesIds: { [name: string]: string };
    context: IApplicationContext;
    dependencies?: { [name: string]: IService | IModuleInfo }

    async installModule(name: string, version: string, reinstall: boolean = false): Promise<IModule> {
        let result: IModule;
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
                let newPath = `${Path.parse(installResult[1]).dir}/.${moduleVersion}@${moduleName}`;

                if (await File.exists(newPath)) {
                    await File.unlink(newPath);
                }
                await File.rename(installResult[1], newPath);

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

    getModule(name: string, version: string): IModule {
        try {
            return this.getModuleInternal(name, version);
        } catch (error) {
            this.context.LoggerManager.Module.error(`Cannot find module '${name}@${version}', maybe you should install it before.`);
            throw error;
        }
    }

    private getModuleInternal(name: string, version: string): IModule {
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
            ExceptionUtils.throwIfInvalidModule(result);
        } catch (error) {
            this.context.LoggerManager.Module.error(`Module '${error}@${version}' is a invalid Kanro module.`);
            throw error;
        }

        return result;
    }

    isModuleInstalled(name: string, version: string): boolean {
        let result: IModule;

        try {
            result = this.getModuleInternal(name, version);
        } catch (error) {
            return false;
        }

        return true;
    }

    async getExecutor(config: IExecutorContainer): Promise<IExecutor> {
        let module = await this.getModuleInternal(config.module.name, config.module.version);
        let result = await module.getExecutor(config);

        try {
            ExceptionUtils.throwIfInvalidExecutor(result);
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