import * as Http from "http";
import * as QueryString from "querystring";
import * as Url from "url";
import { IHttpHeader } from "./IHttpHeader";
import { IHttpParam } from "./IHttpParam";
import { INodeContainer, Node } from "../Core";
import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";
import { IUrlQuery } from "./IUrlQuery";
import { ObjectUtils } from "../Utils";
import { RequestMirror } from "./RequestMirror";
import { Response } from "./Response";

export class Request implements IRequest {
    fork(): IRequest {
        return new RequestMirror(this);
    }
    respond(): IResponse {
        if (this.$response == null) {
            this.$response = new Response(this);
        }

        return this.$response;
    }

    param: IHttpParam;
    meta: Http.IncomingMessage;
    header: IHttpHeader;
    query: IUrlQuery;
    url: string;
    method: string;
    traceStack: INodeContainer<Node>[];

    get relativeUrl(): String {
        return this.routerKey.slice(this.routerIndex).join("/");
    }

    routerKey: string[];
    routerIndex: number;

    $responseMeta: Http.ServerResponse;
    $response: Response;

    constructor(httpRequest: Http.IncomingMessage, httpResponse: Http.ServerResponse) {
        this.meta = httpRequest;
        this.$responseMeta = httpResponse;

        let url: Url.Url = Url.parse(httpRequest.url);
        this.query = QueryString.parse(url.query);
        this.url = url.pathname;

        let skipStart: number = url.pathname.startsWith("/") ? 1 : 0;
        let skipEnd: number = url.pathname.endsWith("/") ? 1 : 0;
        let formattedUrl: string = url.pathname.slice(skipStart, url.pathname.length - skipStart - skipEnd + 1);
        this.routerKey = formattedUrl === "" ? [] : url.pathname.slice(skipStart, url.pathname.length - skipStart - skipEnd + 1).split("/");
        this.routerIndex = 0;

        this.header = ObjectUtils.copy(httpRequest.headers);
        this.method = httpRequest.method;

        this.param = {};
        this.traceStack = [];
    }
}