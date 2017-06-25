import * as Http from "http";
import { IExecutorContainer, IRequestHandlerContainer, IRequestDiverterContainer, IRequestReplicatorContainer, IResponderContainer, IResponseHandlerContainer, IExceptionHandlerContainer, IFuseContainer, IGlobalRequestHandlerContainer, IGlobalResponseHandlerContainer, IGlobalExceptionHandlerContainer } from "../Containers";
import { RequestMirror, Request, Response } from "../Http";
import { NotFoundException, NonstandardExecutorException, ExecutorNotSupportedException } from "../Exceptions";
import { UnexpectedExecutorException } from "../Exceptions/UnexpectedExecutorException";
import { IKanroConfigs, ConfigBuilder } from "../Config";
import { IApplicationContext } from "./IApplicationContext";
import { LoggerManager } from "./LoggerManager";
import { ModuleManager } from "./ModuleManager";
import { ServiceManager } from "./ServiceManager";

export class Application {
    httpServer: Http.Server;
    private context: IApplicationContext;
    private loggerManager: LoggerManager;

    die(error: Error, module: String) {
        this.loggerManager.App.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${error.stack}`)
        process.exit(-1);
    }

    private async fillExecutorInstance(context: IApplicationContext, node: IExecutorContainer | (IExecutorContainer)[]) {
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

    private async entryPoint(request: Http.IncomingMessage, response: Http.ServerResponse) {
        let result: { request: Request | RequestMirror, response: Response, error?: Error } = { request: new Request(request, response), response: undefined, error: undefined };
        let config = this.context.configs.executorsConfig;

        let time = Date.now();

        try {
            try {
                result = await this.handler(result.request, result.response, result.error, config.globalRequestHandler);
                result = await this.handler(result.request, result.response, result.error, config.entryPoint);
                result = await this.handler(result.request, result.response, result.error, config.globalRequestHandler);

                if (result.response == undefined) {
                    throw new NotFoundException();
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
                    await result.response.body.write(response);
                }

                response.end();
            }
            else {
                throw new NotFoundException();
            }
        } catch (error) {
            response.statusCode = 500;
            response.end();
            this.context.LoggerManager.HTTP.error(`Uncaught exception thrown in HTTP handler, message :'${error.message}'`)
        }

        this.context.LoggerManager.HTTP.info(`${request.method} ${request.url} ${response.statusCode} ${Date.now() - time}ms`)
    }

    private async handler(request: Request | RequestMirror, response: Response, error: Error, executor: IExecutorContainer): Promise<{ request: Request | RequestMirror, response: Response, error?: Error }> {
        if (executor == undefined) {
            return { request: request, response: response, error: error };
        }

        request.traceStack.push(executor);
        try {
            let next: IExecutorContainer;
            switch (executor.type) {
                case "RequestHandler":
                    {
                        let node = <IRequestHandlerContainer>executor;
                        request = <any>await node.instance.handler(request);
                        next = node.next;
                        break;
                    }
                case "RequestDiverter":
                    {
                        let node = <IRequestDiverterContainer>executor;
                        next = await node.instance.shunt(request, node.next);
                        break;
                    }
                case "RequestReplicator":
                    {
                        let node = <IRequestReplicatorContainer>executor;
                        let nodes = node.next.map((c) => c.instance);

                        if (node.next.length == 0) {
                            throw new UnexpectedExecutorException(node);
                        }

                        let requests = await node.instance.copy(request, node.next.length);

                        if (node.next.length != requests.length) {
                            throw new NonstandardExecutorException(node);
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
                        let node = <IResponderContainer>executor;
                        response = <any>await node.instance.respond(request);
                        next = node.next;
                        break;
                    }
                case "ResponseHandler":
                    {
                        let node = <IResponseHandlerContainer>executor;
                        response = <any>await node.instance.handler(response);
                        next = node.next;
                        break;
                    }
                case "ExceptionHandler":
                    {
                        let node = <IExceptionHandlerContainer>executor;
                        let res = <any>await node.instance.handler(error, request, response);
                        if (res == undefined) {
                            return undefined;
                        }
                        next = node.next;
                        break;
                    }
                case "Fuse":
                    {
                        let node = <IFuseContainer>executor;
                        let req = <any>await node.instance.fusing(error, request);
                        if (req == undefined) {
                            return undefined;
                        }
                        next = node.next;
                        break;
                    }
                case "GlobalRequestHandler":
                    {
                        let node = <IGlobalRequestHandlerContainer>executor;
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
                        let node = <IGlobalResponseHandlerContainer>executor;
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
                        let node = <IGlobalExceptionHandlerContainer>executor;
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
                    throw new ExecutorNotSupportedException(executor);
            }

            return await this.handler(request, response, error, next);
        } catch (error) {
            let next: IExecutorContainer;

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

    async main(config?: IKanroConfigs) {
        try {
            this.loggerManager.App.info("Booting...");

            if (config == undefined) {
                this.loggerManager.Config.info("Unspecified configs, searching for configs...");
                config = await ConfigBuilder.readConfig();
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

    async reloadConfigs(config?: IKanroConfigs) {
        try {
            this.loggerManager.App.info("Reload configs...");

            if (config == undefined) {
                this.loggerManager.Config.info("Unspecified configs, searching for configs...");
                config = await ConfigBuilder.readConfig();
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
        this.httpServer = Http.createServer((request, response) => {
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