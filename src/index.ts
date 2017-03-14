import { Kanro as KanroCore } from "kanro.core";
import * as Web from "http";
import * as Path from "path";
import * as File from "fs-promise";
import * as Ajv from "Ajv";
import * as Debug from 'debug';
import * as Npm from 'npm';
import * as QueryString from "querystring";
import * as Url from "url";

export namespace Kanro {
    export interface IAppContext {
        moduleManager?: ModuleManager;
        serviceManager?: ServiceManager;
        configs: KanroCore.Config.IKanroConfigs;
    }

    export class App {
        httpServer: Web.Server;
        context: IAppContext;

        static current: App;

        static Die(error: Error, module: "App" | "Module" | "HTTP" | "NPM" | "Config" | "Router") {
            Logger.App.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${error.stack}`)
            process.exit(-1);
        }

        private async fillExecutorInstance(context: IAppContext, node: KanroCore.Config.IExecutorConfig | (KanroCore.Config.IExecutorConfig)[]) {
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
                    } catch (error) {
                        Logger.Module.error(`Create instance of '${node.module.name}@${node.module.version}:${node.name}' fail`)
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
                        throw new KanroCore.Exceptions.KanroNotFoundException();
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
                    throw new KanroCore.Exceptions.KanroNotFoundException();
                }
            } catch (error) {
                response.statusCode = 500;
                response.end();
                Logger.Http.error(`Uncaught exception thrown in HTTP handler, message :'${error.message}'`)
            }

            Logger.Http.info(`${request.method} ${request.url} ${response.statusCode} ${Date.now() - time}ms`)
        }

        private async handler(request: Http.Request | Http.RequestMirror, response: Http.Response, error: Error, executor: KanroCore.Config.IExecutorConfig): Promise<{ request: Http.Request | Http.RequestMirror, response: Http.Response, error?: Error }> {
            if (executor == undefined) {
                return { request: request, response: response, error: error };
            }

            request.traceStack.push(executor);
            try {
                let next: KanroCore.Config.IExecutorConfig;
                switch (executor.type) {
                    case "RequestHandler":
                        {
                            let node = <KanroCore.Config.IRequestHandlerConfig>executor;
                            request = <any>await node.instance.handler(request);
                            next = node.next;
                            break;
                        }
                    case "RequestDiverter":
                        {
                            let node = <KanroCore.Config.IRequestDiverterConfig>executor;
                            next = await node.instance.shunt(request, node.next);
                            break;
                        }
                    case "RequestReplicator":
                        {
                            let node = <KanroCore.Config.IRequestReplicatorConfig>executor;
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
                            let node = <KanroCore.Config.IResponderConfig>executor;
                            response = <any>await node.instance.respond(request);
                            next = node.next;
                            break;
                        }
                    case "ResponseHandler":
                        {
                            let node = <KanroCore.Config.IResponseHandlerConfig>executor;
                            response = <any>await node.instance.handler(response);
                            next = node.next;
                            break;
                        }
                    case "ExceptionHandler":
                        {
                            let node = <KanroCore.Config.IExceptionHandlerConfig>executor;
                            let res = <any>await node.instance.handler(error, request, response);
                            if (res == undefined) {
                                return undefined;
                            }
                            next = node.next;
                            break;
                        }
                    case "Fuse":
                        {
                            let node = <KanroCore.Config.IFuseConfig>executor;
                            let req = <any>await node.instance.fusing(error, request);
                            if (req == undefined) {
                                return undefined;
                            }
                            next = node.next;
                            break;
                        }
                    case "GlobalRequestHandler":
                        {
                            let node = <KanroCore.Config.IGlobalRequestHandlerConfig>executor;
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
                            let node = <KanroCore.Config.IGlobalResponseHandlerConfig>executor;
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
                            let node = <KanroCore.Config.IGlobalExceptionHandlerConfig>executor;
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
                let next: KanroCore.Config.IExecutorConfig;

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

        async main() {
            try {
                Logger.App.info("Initializing...");

                let config = new KanroConfigs();

                Logger.App.info("Load app config...");
                config.appConfig = await ConfigLoader.getKanroConfig();
                Logger.App.info("Load modules config...");
                config.modulesConfig = await ConfigLoader.getModulesConfig();
                Logger.App.info("Load services config...");
                config.serviceConfig = await ConfigLoader.getServicesConfig();
                Logger.App.info("Load executors config...");
                config.executorsConfig = await ConfigLoader.getExecutorsConfig();
                let context = await this.initialize(config);
                this.context = context;
                await this.createHttpServer();

            } catch (error) {
                App.Die(error, "App");
            }
        }

        async reloadConfigs(config: KanroCore.Config.IKanroConfigs) {
            try {
                Logger.App.info("Reload configs...");
                config.appConfig = await ConfigLoader.getKanroConfig(config.appConfig);
                config.modulesConfig = await ConfigLoader.getModulesConfig(config.modulesConfig);
                config.serviceConfig = await ConfigLoader.getServicesConfig(config.serviceConfig);
                config.executorsConfig = await ConfigLoader.getExecutorsConfig(config.executorsConfig);
                let context = await this.initialize(config);
                Logger.App.info("Replace context...");
                this.context = context;
                Logger.App.success("Config have been reloaded");
            } catch (error) {
                Logger.App.error(`An exception occurred in reload config, operation have been cancelled, message: '${error.message}'`);
            }
        }

        private async initialize(configs: KanroCore.Config.IKanroConfigs) {
            let context: IAppContext = { configs: configs };

            Logger.App.info("Check module status...");
            context.moduleManager = await ModuleManager.create(context);
            Logger.App.info("Create services...");
            context.serviceManager = await ServiceManager.create(context);
            Logger.App.info("Initializing executors...");
            await this.fillExecutorInstance(context, configs.executorsConfig.entryPoint);
            await this.fillExecutorInstance(context, configs.executorsConfig.globalRequestHandler);
            await this.fillExecutorInstance(context, configs.executorsConfig.globalResponseHandler);
            await this.fillExecutorInstance(context, configs.executorsConfig.globalExceptionHandlers);
            return context;
        }

        private async createHttpServer() {
            Logger.App.info("Initialize http server...");
            this.httpServer = Web.createServer((request, response) => {
                this.entryPoint(request, response);
            });
            this.httpServer.on('error', (err) => {
                Logger.Http.error(`Error in http server, message: '${err.message}'`);
            });
            this.httpServer.on('listening', (err) => {
                if (err) {
                    Logger.Http.error(`Create http server fail, message: '${err.message}'`);
                    App.Die(err, "HTTP");
                }
                Logger.Http.success(`Http server listening on '${this.context.configs.appConfig.port}'`);
            });
            this.httpServer.listen(this.context.configs.appConfig.port);
        }

        private constructor() {

        }

        static create() {
            if (App.current == undefined) {
                App.current = new App();
            }

            return App.current;
        }
    }

    export namespace Router {
        export class RouterNode {
            path: string;
            children: { [name: string]: RouterNode } = {};
            executor: KanroCore.Config.IExecutorConfig;
            routerKey: RouterKey;


            constructor(path: string) {
                this.path = path;
                if (path != undefined) {
                    this.routerKey = new RouterKey(path);
                }
            }

            addRouter(executor: KanroCore.Config.IExecutorConfig, routerKey: string) {
                let keys = Utils.parseRouterKeys(routerKey).reverse();
                this.add(executor, keys);
            }

            private add(executor: KanroCore.Config.IExecutorConfig, keys: string[]) {
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
                let stack = Utils.copy(routerStack);
                routerStack.pop();
                return stack;
            }
        }

        export class RouterResult {
            param: { [name: string]: string };
            executor: KanroCore.Config.IExecutorConfig;
            deep: number;
            routerStack: RouterKey[];

            constructor(executor: KanroCore.Config.IExecutorConfig, deep: number, routerStack: RouterKey[], param: { [name: string]: string } = {}) {
                this.executor = executor;
                this.deep = deep;
                this.routerStack = routerStack;
                this.param = param;
            }
        }

        export class Router extends KanroCore.Executor implements KanroCore.Core.IRequestDiverter {
            async shunt(request: KanroCore.Core.IRequest, nodes: KanroCore.Config.IExecutorConfig[]): Promise<KanroCore.Config.IExecutorConfig> {
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
                    throw new KanroCore.Exceptions.KanroNotFoundException();
                }

                (<Http.Request>request).routerIndex = deep;
                request["param"] = Object.assign(request["param"] == undefined ? {} : request["param"], selectedNode.param);
                return selectedNode.executor;
            }

            type: KanroCore.Core.ExecutorType.RequestDiverter = KanroCore.Core.ExecutorType.RequestDiverter;
            name: string = "KanroRouter";
            node: RouterNode;
            preRouters: string;

            constructor(config: KanroCore.Config.IRequestDiverterConfig) {
                super(config);
                this.preRouters = config["preRouters"] != undefined ? config["preRouters"] : "";

                config.next = [];
                this.node = new RouterNode(undefined);
                for (let name in config) {
                    if (name.startsWith("/")) {
                        config.next.push(config[name]);
                        this.node.addRouter(config[name], name);
                        if (name.endsWith("/**")) {
                            this.addRouterKeyToNextRouter(`${this.preRouters}${name.slice(0, name.length - 3)}`, config[name]);
                        }
                        else {
                            Logger.Router.success(`Router node '${this.preRouters}${name}' added`);
                        }
                    }
                }
            }

            addRouterKeyToNextRouter(key: string, executor: KanroCore.Core.IExecutor[] | KanroCore.Core.IExecutor) {
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
    }

    export namespace Http {
        export class RequestMirror implements KanroCore.Core.IRequest {
            param: KanroCore.Core.IHttpParam;
            meta: Web.IncomingMessage;
            header: KanroCore.Core.IHttpHeader;
            query: KanroCore.Core.IUrlQuery;
            url: string;
            method: string;
            $response: Response;
            traceStack: KanroCore.Config.IExecutorConfig[];

            routerKey: string[];
            routerIndex: number;

            fork(): KanroCore.Core.IRequest {
                return new RequestMirror(this);
            }
            respond(): KanroCore.Core.IResponse {
                if (this.$response == undefined) {
                    this.$response = new Response(this);
                }

                return this.$response;
            }

            constructor(request: KanroCore.Core.IRequest) {
                for (var key in request) {
                    if (key.startsWith("$") || key == "meta" || typeof request[key] == "function") {
                        break;
                    }

                    this[key] = Utils.copy(request[key]);
                }

                this.traceStack = [].concat(request.traceStack);
            }
        }

        export class Request implements KanroCore.Core.IRequest {
            fork(): KanroCore.Core.IRequest {
                return new RequestMirror(this);
            }
            respond(): KanroCore.Core.IResponse {
                if (this.$response == undefined) {
                    this.$response = new Response(this);
                }

                return this.$response;
            }

            param: KanroCore.Core.IHttpParam;
            meta: Web.IncomingMessage;
            header: KanroCore.Core.IHttpHeader;
            query: KanroCore.Core.IUrlQuery;
            url: string;
            method: string;
            traceStack: KanroCore.Config.IExecutorConfig[];

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

                this.header = Utils.copy(httpRequest.headers);
                this.method = httpRequest.method;

                this.param = {};
                this.traceStack = [];
            }
        }

        export class Response implements KanroCore.Core.IResponse {
            meta: Web.ServerResponse;
            request: KanroCore.Core.IRequest;
            header: KanroCore.Core.IHttpHeader;
            body: KanroCore.Core.IResponseBody;
            status: number;
            traceStack: KanroCore.Config.IExecutorConfig[];

            constructor(request: KanroCore.Core.IRequest) {
                this.meta = request["$responseMeta"];
                this.request = request;
                this.status = 200;
                this.traceStack = request.traceStack;
            }
        }
    }

    export namespace Exceptions {
        export class KanroInvalidConfigException extends KanroCore.Exceptions.KanroException {
            name: string = "Error.Kanro.Config.Invalid";

            constructor(config: string, message: string = undefined, innerException: Error = undefined) {
                super(`Config '${config}' not matched with schema, check your config file${message == undefined ? "" : `, message: '${message}'`}.`, innerException);
            }
        }

        export class KanroArgumentException extends KanroCore.Exceptions.KanroException {
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

    export class ModuleManager implements KanroCore.Core.IModuleManager {
        type: KanroCore.Core.ExecutorType.Service = KanroCore.Core.ExecutorType.Service;
        services: { [name: string]: KanroCore.Core.IService; } = {};
        name: string = "ModuleManager";

        modules: { [name: string]: KanroCore.Core.IModule };
        modulesIds: { [name: string]: string };

        context: IAppContext;

        async installModule(name: string, version: string, reinstall: boolean = false): Promise<KanroCore.Core.IModule> {
            let result: KanroCore.Core.IModule;
            let moduleId = `${name}@${version}`;

            if (name == "kanro.core" || name == "kanro") {
                if (version != "*") {
                    Logger.Module.error(`Require a specific version module '${name}', kanro method should not specific version.`);
                    throw new Error();
                }

                return this.getModuleInternal(name, version);
            }

            if (version == "*") {
                moduleId = `${name}`;
                Logger.Module.info(`Require a unspecific version module '${name}', you should not load a unspecific version module except 'kanro.core' and 'kanro'.`);
            }

            if (await this.isModuleInstalled(name, version)) {
                if (!reinstall) {
                    result = await this.getModuleInternal(name, version);
                    Logger.Module.success(`Module '${moduleId}' have been installed.`);
                }
            }

            if (result == undefined) {
                try {
                    let installResult = await new Promise((res, rej) => {
                        Logger.NPM.info(`Module '${moduleId}' installing...`);

                        Npm.commands.install([`${moduleId}`], (err, data) => {
                            if (err) {
                                Logger.NPM.error(`NPM install module '${moduleId}' fail, message: '${err.message}'.`);
                                rej(err);
                                return;
                            }

                            Logger.NPM.success(`NPM install module '${moduleId}' success.`);
                            res(data);
                        });
                    });

                    let data = installResult[0][0].split("@");
                    let moduleName = data[0];
                    let moduleVersion = data[1];
                    let newPath = `${Path.parse(installResult[0][1]).dir}/.${moduleVersion}@${moduleName}`;
                    if (await File.exists(newPath)) {
                        await File.unlink(newPath);
                    }
                    await File.rename(installResult[0][1], newPath);

                    result = this.getModuleInternal(moduleName, moduleVersion);

                    Logger.Module.success(`Install module '${name}@${version}' success! Path: '${newPath}'.`);
                } catch (error) {
                    Logger.Module.error(`Install module '${name}@${version}' fail! Message: '${error.message}'.`);
                    throw error;
                }
            }

            return result;
        }

        getModule(name: string, version: string): KanroCore.Core.IModule {
            try {
                return this.getModuleInternal(name, version);
            } catch (error) {
                Logger.Module.error(`Cannot find module '${name}@${version}', maybe you should install it before.`);
                throw error;
            }
        }

        private getModuleInternal(name: string, version: string): KanroCore.Core.IModule {
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
                //TODO:
                throw new Error();
            }

            try {
                KanroCore.Exceptions.ExceptionHelper.throwIfInvalidModule(result);
            } catch (error) {
                Logger.Module.error(`Module '${error}@${version}' is a invalid Kanro module.`);
                throw error;
            }

            return result;
        }

        isModuleInstalled(name: string, version: string): boolean {
            let result: KanroCore.Core.IModule;

            try {
                result = this.getModuleInternal(name, version);
            } catch (error) {
                return false;
            }

            return true;
        }

        async getExecutor(config: KanroCore.Config.IExecutorConfig): Promise<KanroCore.Core.IExecutor> {
            let module = await this.getModuleInternal(config.module.name, config.module.version);
            let result = await module.getExecutor(config);

            try {
                KanroCore.Exceptions.ExceptionHelper.throwIfInvalidExecutor(result);
            } catch (error) {
                Logger.Module.error(`Node '${config.module.name}@${config.module.version}:${config.name}' is a invalid Kanro module.`);
                throw error;
            }
            return result;
        }

        private constructor() {
            this.modules = {};
            this.modulesIds = {};
        }

        static async create(context: IAppContext): Promise<ModuleManager> {
            await new Promise((res, rej) => {
                Npm.load({ registry: context.configs.appConfig.registry }, e => {
                    res(e);
                    Logger.NPM.info(`Set NPM registry to '${context.configs.appConfig.registry}'.`);
                });
            });

            Npm.on('log', function (message) {
                Logger.NPM.info(message)
            });

            let result = new ModuleManager();
            result.context = context;
            context.moduleManager = result;
            result.modules["kanro"] = new KanroModule(context);
            result.modules["kanro.core"] = new KanroCore.KanroCoreModule();

            for (let module of context.configs.modulesConfig) {
                await result.installModule(module.name, module.version);
            }

            return result;
        }
    }

    export class ServiceManager implements KanroCore.Core.IServiceManager {
        type: KanroCore.Core.ExecutorType.Service = KanroCore.Core.ExecutorType.Service;
        dependencies: { [name: string]: KanroCore.Core.IService; };
        name: string = "ServiceManager";

        services: { [module: string]: { [name: string]: KanroCore.Config.IServiceConfig } };
        nameOnlyServices: { [name: string]: KanroCore.Config.IServiceConfig };

        context: IAppContext;

        private async fillServiceInstance(node: KanroCore.Config.IServiceConfig | (KanroCore.Config.IServiceConfig)[]) {

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
                    Logger.Service.error(`Fill service instance fail, message: ${error.message}`);
                    throw error;
                }
            }
        }

        async fillServiceDependencies(node: KanroCore.Config.IExecutorConfig | (KanroCore.Config.IExecutorConfig)[]) {
            if (node == undefined) {
                return;
            }

            if (Array.isArray(node)) {
                for (let n of node) {
                    await this.fillServiceDependencies(n);
                }
            } else {
                try {
                    let fill: KanroCore.Config.IServiceConfig[] = [];
                    let fillInstance: { [name: string]: KanroCore.Core.IService } = {};
                    if (Array.isArray(node.dependencies)) {
                        for (let dependency of node.dependencies) {
                            let service = this.getService(dependency);
                            if (service == undefined || service.instance == undefined) {
                                Logger.Service.error(`Cannot find service '${dependency.module.name}@${dependency.module.version}:${dependency.name}', you should to define it in 'services.json'`);
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
                        let instance = <KanroCore.Core.IExecutor>node["instance"];
                        if (instance.dependencies != undefined) {
                            for (let property in fillInstance) {
                                instance.dependencies[property] = fillInstance[property];
                            }
                            for (let property in instance.dependencies) {
                                if (instance.dependencies[property] == undefined) {
                                    if (this.nameOnlyServices[property] == undefined) {
                                        throw new Error(`'${property}' required in '${node.module.name}@${node.module.version}:${node.name}', but no service provided`);
                                    }
                                    else {
                                        instance.dependencies[property] = this.nameOnlyServices[property].instance;
                                    }
                                }
                            }
                        } else {
                            instance.dependencies = fillInstance;
                        }
                    }
                } catch (error) {
                    Logger.Service.error(`Solution dependent of '${node.module.name}@${node.module.version}:${node.name}' fail, message: ${error.message}`)
                    throw error;
                }
            }
        }

        getService(node: KanroCore.Config.IServiceConfig): KanroCore.Config.IServiceConfig {
            let result = this.services[`${node.module.name}@${node.module.version}`][node.name];
            if (result == null) {
                Logger.Service.error(`Service ${node.module.name}@${node.module.version}:${node.name} is undefined`);
                return undefined;
            }
            if (result.type != "Service" && (result.instance == undefined || result.instance.type != KanroCore.Core.ExecutorType.Service)) {
                Logger.Service.error(`${node.module.name}@${node.module.version}:${node.name} is not a Service`);
                return undefined;
            }

            return result;
        }

        private constructor() {
            this.services = {};
            this.nameOnlyServices = {};
        }

        static async create(context: IAppContext): Promise<ServiceManager> {
            let result = new ServiceManager();
            result.context = context;
            context.serviceManager = result;

            let services = context.configs.serviceConfig;
            await result.fillServiceInstance(services);
            await result.fillServiceDependencies(services);

            return result;
        }
    }

    export class KanroManager implements KanroCore.Core.IKanroManager {
        type: KanroCore.Core.ExecutorType.Service = KanroCore.Core.ExecutorType.Service;
        dependencies: { [name: string]: KanroCore.Core.IService; } = {};
        name: string = "KanroManager";

        async reloadConfigs(configs: KanroCore.Config.IKanroConfigs) : Promise<void> {
            if(App.current == undefined){
                throw new Error("Kanro is not running");
            }

            await App.current.reloadConfigs(configs);
        }
    }

    export class Logger {
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
                    var prefix = '  \u001b[3' + c + 'm' + Utils.rightPad(name, 16, ' ') + '- ' + '\u001b[0m';
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

    export enum LoggerLevel {
        Info, Success, Error
    }

    export class Utils {
        static copy<T>(object: T): T {
            if (Array.isArray(object)) {
                return <any>[].concat(object);
            }

            return { ... <any>object };
        }

        static parseRouterKeys(path: string): string[] {
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

        static isEmptyObject(obj) {
            return !Object.keys(obj).length;
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

    export class KanroConfigs implements KanroCore.Config.IKanroConfigs {
        appConfig: KanroCore.Config.IAppConfig;
        modulesConfig: KanroCore.Core.IModuleInfo[];
        serviceConfig: KanroCore.Config.IServiceConfig[];
        executorsConfig: KanroCore.Config.IExecutorsConfig;

        static async createFromConfigFiles(): Promise<KanroConfigs> {
            let result = new KanroConfigs();
            result.appConfig = await ConfigLoader.getKanroConfig();
            result.modulesConfig = await ConfigLoader.getModulesConfig();
            result.serviceConfig = await ConfigLoader.getServicesConfig();
            result.executorsConfig = await ConfigLoader.getExecutorsConfig();
            return result;
        }
    }

    export class ConfigLoader {
        private static ajv: Ajv.Ajv;

        static async getModulesConfig(config: any = undefined): Promise<KanroCore.Core.IModuleInfo[]> {
            try {
                return await this.getConfig("modules", config);
            } catch (error) {
                Logger.Config.error(`Error on load modules config, message: '${error.message}'`);
                App.Die(error, "Config");
            }
        }

        static async getExecutorsConfig(config: any = undefined): Promise<KanroCore.Config.IExecutorsConfig> {
            try {
                return await this.getConfig("executors", config);
            } catch (error) {
                Logger.Config.error(`Error on load executors config, message: '${error.message}'`);
                App.Die(error, "Config");
            }
        }

        static async getKanroConfig(config: any = undefined): Promise<KanroCore.Config.IAppConfig> {
            try {
                var env = process.env.NODE_ENV || 'dev';

                return await this.getConfig("kanro_" + env, config);
            } catch (error) {
                Logger.Config.error(`Error on load kanro config, message: '${error.message}'`);
                App.Die(error, "Config");
            }
        }

        static async getServicesConfig(config: any = undefined): Promise<KanroCore.Config.IServiceConfig[]> {
            try {
                return await this.getConfig("services", config);
            } catch (error) {
                Logger.Config.error(`Error on load services config, message: '${error.message}'`);
                App.Die(error, "Config");
            }
        }

        static async getConfig(name: string, configObject: any = undefined): Promise<any> {
            await ConfigLoader.initialize();

            let schemaFileName = name;
            let schemasMap = File.readJsonSync('./schema/schemas_map.json');

            if (schemasMap != undefined) {
                schemaFileName = schemasMap[name] == undefined ? name : schemasMap[name];
            }

            let configFile = `./${name}.json`;
            let config = configObject == undefined ? File.readJsonSync(configFile) : configObject;


            if (!ConfigLoader.ajv.validate(schemaFileName, config)) {
                throw new Exceptions.KanroInvalidConfigException(name, ConfigLoader.ajv.errors.pop().message);
            }

            return config;
        }

        private static async initialize() {
            if (ConfigLoader.ajv != undefined) {
                return;
            }

            ConfigLoader.ajv = new Ajv();

            let schemas = await File.readdir(`schema`);

            for (let schema of schemas) {
                let file = `./schema/${schema}`;
                let fileInfo = Path.parse(schema);
                if (fileInfo.ext != ".json") {
                    continue;
                }

                let schemaObject = await File.readJson(file);
                if (!this.ajv.validateSchema(schemaObject)) {
                    continue;
                }

                this.ajv.addSchema(schemaObject, fileInfo.name);
            }
        }
    }

    export class KanroModule implements KanroCore.Core.IModule {
        context: IAppContext;
        executorInfos: { [name: string]: KanroCore.Core.IExecutorInfo; };
        async getExecutor(config: KanroCore.Config.IExecutorConfig): Promise<KanroCore.Core.IExecutor> {
            switch (config.name) {
                case "KanroRouter":
                    return new Router.Router(<any>config);
                case "ModuleManager":
                    return this.context.moduleManager;
                case "ServiceManager":
                    return this.context.serviceManager;
            }
            return undefined;
        }

        constructor(context: IAppContext) {
            this.context = context;
            this.executorInfos = {
                KanroRouter: { type: KanroCore.Core.ExecutorType.RequestDiverter, name: "KanroRouter" },
                ModuleManager: { type: KanroCore.Core.ExecutorType.Service, name: "ModuleManager" },
                ServiceManager: { type: KanroCore.Core.ExecutorType.Service, name: "ServiceManager" }
            };
        }
    }
}

let kanro = Kanro.App.create();
kanro.main();