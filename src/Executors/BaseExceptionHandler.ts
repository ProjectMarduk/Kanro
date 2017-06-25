import { IRequest, IResponse, JsonResponseBody } from "../Http";
import { IExceptionHandlerContainer } from "../Containers";
import { HttpException } from "../Exceptions";
import { BaseExecutor } from "./BaseExecutor";
import { IExceptionHandler } from "./IExceptionHandler";
import { ExecutorType } from "./ExecutorType";

export class BaseExceptionHandler extends BaseExecutor implements IExceptionHandler {
    async handler(err: Error, request: IRequest, response: IResponse): Promise<IResponse> {
        if (!err.name.startsWith("Error.Kanro.Http")) {
            return undefined;
        } else {
            let kanroHttpException: HttpException = <any>err;

            let response = request.respond();
            response.status = kanroHttpException.status;
            response.body = new JsonResponseBody({ code: response.status, message: kanroHttpException.message });
            return response;
        }
    }

    type: ExecutorType.ExceptionHandler = ExecutorType.ExceptionHandler;
    name: string = "BaseExceptionHandler";

    constructor(config: IExceptionHandlerContainer) {
        super(config);
    }
}