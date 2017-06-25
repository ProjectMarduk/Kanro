import { ExecutorType, IService, IExecutor } from "../Executors";
import { IServiceContainer, IExecutorContainer } from "../Containers";
import { IServiceManager } from "./IServiceManager";
import { IApplicationContext } from "./IApplicationContext";
import { IModuleInfo } from "./IModuleInfo";

export class ServiceManager implements IServiceManager {
    type: ExecutorType.Service = ExecutorType.Service;
    name: string = "ServiceManager";
    services: { [module: string]: { [name: string]: IServiceContainer } };
    nameOnlyServices: { [name: string]: IServiceContainer };
    context: IApplicationContext;
    dependencies?: { [name: string]: IService | IModuleInfo }

    private async fillServiceInstance(node: IServiceContainer | (IServiceContainer)[]) {

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

    async fillServiceDependencies(node: IExecutorContainer | (IExecutorContainer)[]) {
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
                let fill: IServiceContainer[] = [];
                let fillInstance: { [name: string]: IService } = {};
                let instance: IExecutor = node["instance"];

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
                    let instance = <IExecutor>node["instance"];
                    if (instance.dependencies != undefined) {
                        for (let property in fillInstance) {
                            instance.dependencies[property] = fillInstance[property];
                        }
                        for (let property in instance.dependencies) {
                            if (instance.dependencies[property] != undefined && instance.dependencies[property]["name"] != undefined && instance.dependencies[property]["version"] != undefined) {
                                let serviceConfig: IServiceContainer = { name: property, module: <IModuleInfo>instance.dependencies[property], type: "Service" };
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

    getService(node: IServiceContainer): IServiceContainer {
        if (this.services[`${node.module.name}@${node.module.version}`] == undefined) {
            return undefined;
        }

        let result = this.services[`${node.module.name}@${node.module.version}`][node.name];

        if (result == null) {
            this.context.LoggerManager.Service.error(`Service ${node.module.name}@${node.module.version}:${node.name} is undefined`);
            return undefined;
        }
        if (result.type != "Service" && (result.instance == undefined || result.instance.type != ExecutorType.Service)) {
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