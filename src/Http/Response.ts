import { ObjectUtils } from "../Utils"

import * as Http from "http";
import { IExecutorContainer } from "../Containers";
import { IResponse } from "./IResponse";
import { IRequest } from "./IRequest";
import { IHttpHeader } from "./IHttpHeader";
import { IResponseBody } from "./IResponseBody";

export class Response implements IResponse {
    meta: Http.ServerResponse;
    request: IRequest;
    header: IHttpHeader;
    body: IResponseBody;
    status: number;
    traceStack: IExecutorContainer[];

    constructor(request: IRequest) {
        this.meta = request["$responseMeta"];
        this.request = request;
        this.status = 200;
        this.traceStack = request.traceStack;
    }
}