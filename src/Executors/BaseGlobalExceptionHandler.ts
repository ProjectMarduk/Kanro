import { IRequest, IResponse, JsonResponseBody } from "../Http";
import { IGlobalExceptionHandlerContainer } from "../Containers";
import { HttpException } from "../Exceptions";
import { BaseExecutor } from "./BaseExecutor";
import { IGlobalExceptionHandler } from "./IGlobalExceptionHandler";
import { ExecutorType } from "./ExecutorType";

export class BaseGlobalExceptionHandler extends BaseExecutor implements IGlobalExceptionHandler {
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

    type: ExecutorType.GlobalExceptionHandler = ExecutorType.GlobalExceptionHandler;
    name: string = "BaseGlobalExceptionHandler";

    constructor(config: IGlobalExceptionHandlerContainer) {
        super(config);
    }
}