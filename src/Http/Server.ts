import * as Http from "http";
import { RequestContext } from "./RequestContext";
import { Request } from "./Request";

export interface IHttpRequestHandler {
    (context: RequestContext): Promise<RequestContext>;
}

export class Server {
    private httpServer: Http.Server;
    private handler: (request: Http.IncomingMessage, response: Http.ServerResponse) => Promise<void>;
    private eventHandler: (name, error) => Promise<void>;
    private port: number;

    constructor(port: number, handler: (request: Http.IncomingMessage, response: Http.ServerResponse) => Promise<void>, eventHandler: (name, error) => Promise<void>) {
        this.port = port;
        this.handler = handler;
        this.eventHandler = eventHandler;
    }

    async startListen() {
        await new Promise<void>((res, rej) => {
            this.httpServer = Http.createServer(async (request, response) => {
                this.entryPoint(request, response);
            });
            this.httpServer.on('error', async (err) => {
                await this.eventHandler("error", err);
            });
            this.httpServer.on('listening', async (err) => {
                await this.eventHandler("listening", err);
                res();
            });
            this.httpServer.on('close', async (err) => {
                await this.eventHandler("close", err);
            });
            this.httpServer.listen(this.port);
        });
    }

    hotSwap(handler: (request: Http.IncomingMessage, response: Http.ServerResponse) => Promise<void>, eventHandler: (name, error) => Promise<void>) {
        this.handler = handler;
        this.eventHandler = eventHandler;
    }

    private async entryPoint(request: Http.IncomingMessage, response: Http.ServerResponse) {
        if (this.handler != null) {
            await this.handler(request, response);
        }
        response.end();
    }

    close(){
        this.httpServer.close();
    }
}