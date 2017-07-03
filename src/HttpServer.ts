import * as Http from "http";
import { RequestContext } from "./RequestContext";
import { Request } from "./Http";
import { INodeContainer, Node } from "./Core/index";
import { LoggerManager } from "./LoggerManager";
import { AnsiStyle, Colors, Style } from "./Logging/index";
import { Application, HttpMethod } from "./Application";

let httpLogger = LoggerManager.current.registerLogger("HTTP", AnsiStyle.create().foreground(Colors.yellow));

export interface IHttpRequestHandler {
    (context: RequestContext): Promise<RequestContext>;
}

export class HttpServer {
    private httpServer: Http.Server;
    private handler: IHttpRequestHandler;

    private constructor() {
    }

    private static instance: HttpServer;

    static get current(): HttpServer {
        return HttpServer.instance;
    }

    static async initialize(port: number, handler: IHttpRequestHandler): Promise<HttpServer> {
        if (HttpServer.instance != undefined) {
            return HttpServer.instance;
        }

        HttpServer.instance = new HttpServer();
        HttpServer.instance.handler = handler;

        await new Promise<void>((res, rej) => {
            HttpServer.instance.httpServer = Http.createServer(async (request, response) => {
                HttpServer.instance.entryPoint(request, response);
            });
            HttpServer.instance.httpServer.on('error', (err) => {
                httpLogger.error(`Error in http server, message: '${err.message}'`);
                Application.current.die(err, "HTTP");
            });
            HttpServer.instance.httpServer.on('listening', (err) => {
                if (err) {
                    httpLogger.error(`Create http server fail, message: '${err.message}'`);
                    Application.current.die(err, "HTTP");
                }
                httpLogger.success(`Http server listening on '${port}'.`);
                res();
            });
            HttpServer.instance.httpServer.listen(port);
        });

        return HttpServer.instance;
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
}