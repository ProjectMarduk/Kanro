import * as Http from "http";
import { IHttpHeader } from "./IHttpHeader";
import { INodeContainer, Node } from "../Core";
import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";
import { IResponseBody } from "./IResponseBody";
import { ObjectUtils } from "../Utils";

export class Response implements IResponse {
    meta: Http.ServerResponse;
    request: IRequest;
    header: IHttpHeader;
    body: IResponseBody;
    status: number;
    traceStack: INodeContainer<Node>[];

    constructor(request: IRequest) {
        // tslint:disable-next-line:no-string-literal
        this.meta = request["$responseMeta"];
        this.request = request;
        this.status = 200;
        this.traceStack = request.traceStack;
    }
}