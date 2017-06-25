import { HttpException } from "./HttpException";

export class BandwidthLimitExceededException extends HttpException {
    public name: string = "Error.Kanro.Http.BandwidthLimitExceeded";

    constructor(message: string = "Bandwidth Limit Exceeded", innerException: Error = undefined) {
        super(509, message, innerException);
    }
}