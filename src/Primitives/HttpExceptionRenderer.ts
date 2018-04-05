import { ExceptionHandler } from "../Core";
import { HttpException } from "../Exceptions";
import { IRequest, IResponse, JsonResponseBody } from "../Http";

export class HttpExceptionRenderer extends ExceptionHandler {
    async handler(err: Error, request: IRequest, response: IResponse): Promise<IResponse> {
        if (!err.name.startsWith("Error.Kanro.Http")) {
            return undefined;
        } else {
            let kanroHttpException: HttpException = <any>err;

            let response: IResponse = request.respond();
            response.status = kanroHttpException.status;
            response.body = new JsonResponseBody({ code: response.status, message: kanroHttpException.message });
            return response;
        }
    }
}