import { Request } from "./Request";
import { RequestMirror } from "./RequestMirror";
import { Response } from "./Response";
import { INodeContainer, Node } from "../Core";

export class RequestContext {
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