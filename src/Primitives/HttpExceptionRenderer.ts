import { ExceptionHandler } from "../Core";
import { IRequest, IResponse, JsonResponseBody } from "../Http";
import { HttpException } from "../Exceptions";

export class HttpExceptionRenderer extends ExceptionHandler {
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
}