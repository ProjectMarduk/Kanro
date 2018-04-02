import * as Http from "http";
import { Request, IHttpRequestHandler, RequestContext, Server } from "./Http";
import { INodeContainer, Node, Service, IModuleInfo } from "./Core";
import { LoggerManager } from "./LoggerManager";
import { AnsiStyle, Colors, Style, ILogger } from "./Logging";
import { Application, HttpMethod } from "./Application";
import { KanroInternalModule } from "./KanroInternalModule";

export class HttpServer extends Service {
    private httpServer: Server;
    private handler: IHttpRequestHandler;
    private port: number;
    private preHttpServer: HttpServer;

    dependencies = {
        loggerManager: {
            name: LoggerManager.name,
            module: KanroInternalModule.moduleInfo
        },
        application: {
            name: Application.name,
            module: KanroInternalModule.moduleInfo
        }
    }

    public get isProxable() {
        return false;
    }

    constructor() {
        super(undefined);
    }

    async onLoaded(): Promise<void> {
        this.httpLogger = this.getDependedService<LoggerManager>("loggerManager").registerLogger("HTTP", AnsiStyle.create().foreground(Colors.yellow));
    }

    private get application(): Application {
        return this.getDependedService<Application>("application");
    }
    private httpLogger: ILogger;

    async initialize(port: number, handler: IHttpRequestHandler, httpServer?: HttpServer): Promise<HttpServer> {
        this.port = port;
        this.handler = handler;
        this.preHttpServer = httpServer;

        if (httpServer != undefined && httpServer.port == port) {
            this.httpLogger.info(`Hot swapping http server...`);
            this.httpServer = httpServer.httpServer;
            this.httpServer.hotSwap(async (request, response) => {
                await this.entryPoint(request, response);
            }, async (name, error) => {
                await this.eventHandler(name, error);
            });
        }
        else {
            this.httpServer = new Server(port, async (request, response) => {
                await this.entryPoint(request, response);
            }, async (name, error) => {
                await this.eventHandler(name, error);
            })
            await this.httpServer.startListen();
        }

        return this;
    }

    private async entryPoint(request: Http.IncomingMessage, response: Http.ServerResponse) {
        let context = new RequestContext(new Request(request, response));

        try {
            context = await this.handler(context);

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
            this.httpLogger.error(`Uncaught exception thrown in HTTP handler, message :'${error.message}'`)
        }

        this.httpLogger.info(this.buildHttpLogMessage(context));
    }

    private async eventHandler(name, error) {
        switch (name) {
            case "error":
                this.httpLogger.error(`Error in http server, message: '${error.message}'`);
                this.application.die(error, "HTTP");
                break;
            case "listening":
                if (error) {
                    this.httpLogger.error(`Create http server fail, message: '${error.message}'`);
                    this.application.die(error, "HTTP");
                }
                this.httpLogger.success(`Http server listening on '${this.port}'.`);

                if (!error && this.preHttpServer != undefined) {
                    this.httpLogger.info(`Deprecated http server will be closed in 1 minute.`);
                    setTimeout(() => {
                        this.preHttpServer.httpServer.close();
                        this.preHttpServer = null;
                    }, 60000);
                }
                break;
            case "close":
                this.httpLogger.info(`Deprecated http server on '${this.port}' closed.`);
                
                break;
        }
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
}