import { ArgumentException } from "./ArgumentException";

export class ArgumentTypeNotMatchedException extends ArgumentException {
    name: string = "Error.Kanro.Argument.TypeNotMatched";

    constructor(paramName: string, type: string, innerException?: Error) {
        super(`Type of '${paramName}' is not matched of '${type}'.`, paramName, innerException);
    }
}