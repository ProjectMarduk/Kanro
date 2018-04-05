import { INodeContainer, Node } from "../Core";
import { Request } from "./Request";
import { RequestMirror } from "./RequestMirror";
import { Response } from "./Response";

export class RequestContext {
    request: Request | RequestMirror;
    response: Response;
    error?: Error;
    traceStack: INodeContainer<Node>[];
    time: number;

    constructor(request: Request | RequestMirror) {
        this.request = request;
        this.traceStack = [];
        this.time = Date.now();
    }

    fork(request: Request | RequestMirror, response: Response): RequestContext {
        let result: RequestContext = new RequestContext(request);
        result.response = response;
        result.error = this.error;
        result.traceStack = this.traceStack.slice(0);
        result.time = this.time;

        return result;
    }
}