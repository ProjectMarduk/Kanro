import { HttpException } from "./HttpException";

export class BandwidthLimitExceededException extends HttpException {
    name: string = "Error.Kanro.Http.BandwidthLimitExceeded";

    constructor(message: string = "Bandwidth Limit Exceeded", innerException?: Error) {
        super(509, message, innerException);
    }
}