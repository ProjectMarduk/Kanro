import { ObjectUtils } from "../Utils"
import * as Http from "http";
import { INodeContainer, Node } from "../Core";
import { IRequest } from "./IRequest";
import { IHttpParam } from "./IHttpParam";
import { IHttpHeader } from "./IHttpHeader";
import { IUrlQuery } from "./IUrlQuery";
import { IResponse } from "./IResponse";
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
        if (this.$response == undefined) {
            this.$response = new Response(this);
        }

        return this.$response;
    }

    constructor(request: IRequest) {
        for (var key in request) {
            if (key.startsWith("$") || key == "meta" || typeof request[key] == "function") {
                break;
            }

            this[key] = ObjectUtils.copy(request[key]);
        }

        this.traceStack = [].concat(request.traceStack);
    }
}