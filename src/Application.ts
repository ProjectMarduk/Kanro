import * as Http from "http";
import { RequestMirror, Request, Response } from "./Http";
import { NotFoundException, NonstandardNodeException, NodeNotSupportedException } from "./Exceptions";
import { UnexpectedNodeException } from "./Exceptions/UnexpectedNodeException";
import { LoggerManager } from "./LoggerManager";
import { ModuleManager } from "./ModuleManager";
import { INodeContainer, Node, RequestHandler, RequestDiverter, RequestReplicator, Responder, ResponseHandler, ExceptionHandler, Fuse } from "./Core";
import { IAppConfig } from "./IAppConfig";
import { Colors, Style, AnsiStyle } from "./Logging";
import { ConfigBuilder } from "./ConfigBuilder";
import { KanroModule } from "./KanroModule";

let appLogger = LoggerManager.current.registerLogger("Kanro:App", Colors.magenta);
let configLogger = LoggerManager.current.registerLogger("Kanro:Config", Colors.green);
let httpLogger = LoggerManager.current.registerLogger("Kanro:HTTP", Colors.yellow);

class RequestContext {
    public request: Request | RequestMirror;
    public response: Response;
    public error?: Error;
    public traceStack: INodeContainer<Node>[];
    public time: number;

    public constructor(request: Request | RequestMirror) {
        this.request = request;
        this.traceStack = [];
        this.time = Date.now();
    }

    fork(request: Request | RequestMirror, response: Response): RequestContext {
        let result = new RequestContext(request);
        result.response = response;
        result.error = this.error;
        result.traceStack = this.traceStack.slice(0);
        result.time = this.time;

        return result;
    }
}

export enum HttpMethod {
    get = Colors.green,
    post = Colors.blue,
    put = Colors.cyan,
    delete = Colors.red,
    patch = Colors.yellow
}

export class Application {
    private httpServer: Http.Server;
    private appConfig: IAppConfig;

    private die(error: Error, module: String) {
        appLogger.error(`A catastrophic failure occurred in 'Kanro:${module}'\n    ${error.stack}`)
        process.exit(-1);
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

    private async entryPoint(request: Http.IncomingMessage, response: Http.ServerResponse) {
        let context: RequestContext = new RequestContext(new Request(request, response));
        let config = this.appConfig;

        try {
            context = await this.handler(context, config.entryPoint);
            context = await this.handler(context, config.exitPoint);

            if (context.response == undefined) {
                response.statusCode = 404;
                response.end();
            }
            else {
                if (context.response.status != undefined) {
                    response.statusCode = context.response.status;
                }
                if (context.response.header != undefined) {
                    for (var key in context.response.header) {
                        response.setHeader(key, context.response.header[key]);
                    }
                }
                if (context.response.body != undefined) {
                    await context.response.body.write(response);
                }
                response.end();
            }
        } catch (error) {
            response.statusCode = 500;
            response.end();
            httpLogger.error(`Uncaught exception thrown in HTTP handler, message :'${error.message}'`)
        }
        httpLogger.info(this.buildHttpLogMessage(context));
    }

    private buildHttpLogMessage(context: RequestContext) {
        let methodColor: Colors;
        let timeColor: Colors;
        let statusColor: Colors;
        if (HttpMethod[context.request.method.toLowerCase()] != undefined) {
            methodColor = <number>HttpMethod[context.request.method.toLowerCase()];
        }
        else {
            methodColor = Colors.white;
        }

        let costTime = Date.now() - context.time;

        if (costTime < 10) {
            timeColor = Colors.green;
        }
        else if (costTime < 50) {
            timeColor = Colors.cyan;
        }
        else if (costTime < 100) {
            timeColor = Colors.blue;
        }
        else if (costTime < 500) {
            timeColor = Colors.yellow;
        }
        else if (costTime < 1000) {
            timeColor = Colors.red;
        }
        else {
            timeColor = Colors.magenta;
        }

        if (context.response.status >= 500) {
            statusColor = Colors.red;
        }
        else if (context.response.status >= 400) {
            statusColor = Colors.yellow;
        }
        else if (context.response.status >= 300) {
            statusColor = Colors.cyan;
        }
        else if (context.response.status >= 200) {
            statusColor = Colors.green;
        }
        else if (context.response.status >= 100) {
            statusColor = Colors.blue;
        }
        else {
            statusColor = Colors.magenta;
        }

        return Style`${AnsiStyle.create().foreground(methodColor)}${context.request.method} ${context.request.url} ${AnsiStyle.create().foreground(statusColor)}${context.response.status} ${AnsiStyle.create().foreground(timeColor)}${`${costTime}ms`} `;
    }

    private async handler(context: RequestContext, container: INodeContainer<Node>): Promise<RequestContext> {
        if (container == undefined) {
            return context;
        }

        context.traceStack.push(container);

        try {
            let next: INodeContainer<Node>;

            if (container.instance instanceof RequestHandler) {
                context.request = <any>await container.instance.handler(context.request);
                next = <INodeContainer<Node>>container.next;
            }
            else if (container.instance instanceof RequestDiverter) {
                next = await container.instance.shunt(context.request, <INodeContainer<Node>[]>container.next);
            }
            else if (container.instance instanceof RequestReplicator) {
                let nextNodeContainers = <INodeContainer<Node>[]>container.next;

                let nodes = nextNodeContainers.map((c) => c.instance);
                if (nextNodeContainers.length == 0) {
                    throw new UnexpectedNodeException(container);
                }

                let requests = await container.instance.copy(context.request, nextNodeContainers.length);

                if (nextNodeContainers.length != requests.length) {
                    throw new NonstandardNodeException(container);
                }

                requests.forEach((v, i, a) => {
                    if (i == 0) {
                        context.request = <any>v;
                    }
                    else {
                        this.handler(context.fork(<any>v, undefined), nextNodeContainers[i]);
                    }
                });

                next = nextNodeContainers[0];
            }
            else if (container.instance instanceof Responder) {
                context.response = <any>await container.instance.respond(context.request);
                next = <INodeContainer<Node>>container.next;
            }
            else if (container.instance instanceof ResponseHandler) {
                context.response = await container.instance.handler(context.response);
                next = <INodeContainer<Node>>container.next;
            }
            else if (container.instance instanceof ExceptionHandler) {
                let res = <any>await container.instance.handler(context.error, context.request, context.response);
                if (res == undefined) {
                    return undefined;
                }
                context.response = res;
                next = <INodeContainer<Node>>container.next;
            }
            else if (container.instance instanceof Fuse) {
                let req = <any>await container.instance.fusing(context.error, context.request);
                if (req == undefined) {
                    return undefined;
                }
                context.request = req;
                next = <INodeContainer<Node>>container.next;
            }

            return await this.handler(context, next);
        } catch (error) {
            context.error = error;

            if (container.fuses != undefined) {
                for (let fuse of container.fuses) {
                    try {
                        let result = await this.handler(context, fuse);
                        if (result != undefined) {
                            return result;
                        }
                    } catch(error) {
                        continue;
                    }
                }
            }

            if (container.exceptionHandlers != undefined) {
                for (let exceptionHandler of container.exceptionHandlers) {
                    try {
                        let result = await this.handler(context, exceptionHandler);
                        if (result != undefined) {
                            return result;
                        }
                    } catch(error) {
                        continue;
                    }
                }
            }

            throw error;
        }
    }

    async run(config?: IAppConfig) {
        this.helloKanro();

        try {
            appLogger.info("Booting...");

            appLogger.info("Create application context...");
            if (config == undefined) {
                configLogger.info("Unspecified configs, searching for configs...");
                config = await ConfigBuilder.readConfig();
            }
            this.appConfig = config;

            appLogger.info("Initialize module manager...");
            await ModuleManager.initialize(config);
            ModuleManager.current.registerModule('kanro', '*', new KanroModule(this));

            appLogger.info("Install module and fill nodes...");
            await ModuleManager.current.loadConfig(config);

            appLogger.info("Booting HTTP server...");
            await this.createHttpServer(config);

            appLogger.success("Kanro is ready.");
        } catch (error) {
            this.die(error, "App");
        }
    }

    async reloadConfigs(config?: IAppConfig) {
        try {
            appLogger.info("Reload configs...");

            appLogger.info("Create application context...");
            if (config == undefined) {
                configLogger.info("Unspecified configs, searching for configs...");
                config = await ConfigBuilder.readConfig();
            }

            appLogger.info("Install module and fill nodes...");
            await ModuleManager.current.loadConfig(config);

            appLogger.info("Replace context...");
            this.appConfig = config;
            appLogger.success("Config have been reloaded");
        } catch (error) {
            appLogger.error(`An exception occurred in reload config, operation have been cancelled, message: '${error.message}'`);
        }
    }

    public get config(): Readonly<IAppConfig> {
        return this.appConfig;
    }

    private async createHttpServer(config: IAppConfig) {
        return new Promise<void>((res, rej) => {
            this.httpServer = Http.createServer((request, response) => {
                this.entryPoint(request, response);
            });
            this.httpServer.on('error', (err) => {
                httpLogger.error(`Error in http server, message: '${err.message}'`);
                this.die(err, "HTTP");
            });
            this.httpServer.on('listening', (err) => {
                if (err) {
                    httpLogger.error(`Create http server fail, message: '${err.message}'`);
                    this.die(err, "HTTP");
                }
                httpLogger.success(`Http server listening on '${config.port}'`);
                res();
            });
            this.httpServer.listen(config.port);
        });
    }

    constructor() {
    }
}