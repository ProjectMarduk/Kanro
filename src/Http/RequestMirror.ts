import * as Http from "http";
import { IHttpHeader } from "./IHttpHeader";
import { IHttpParam } from "./IHttpParam";
import { INodeContainer, Node } from "../Core";
import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";
import { IUrlQuery } from "./IUrlQuery";
import { ObjectUtils } from "../Utils";
import { Response } from "./Response";

export class RequestMirror implements IRequest {
    param: IHttpParam;
    meta: Http.IncomingMessage;
    header: IHttpHeader;
    query: IUrlQuery;
    url: string;
    method: string;
    $response: Response;
    traceStack: INodeContainer<Node>[];

    routerKey: string[];
    routerIndex: number;

    get relativeUrl(): String {
        return this.routerKey.slice(this.routerIndex).join("/");
    }

    fork(): IRequest {
        return new RequestMirror(this);
    }
    respond(): IResponse {
        if (this.$response == null) {
            this.$response = new Response(this);
        }

        return this.$response;
    }

    constructor(request: IRequest) {
        for (let key in request) {
            if(request.hasOwnProperty(key)) {
                if (key.startsWith("$") || key === "meta" || typeof request[key] === "function") {
                    break;
                }
                this[key] = ObjectUtils.copy(request[key]);
            }
        }

        this.traceStack = [].concat(request.traceStack);
    }
}