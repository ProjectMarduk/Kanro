import { ArgumentException } from "./ArgumentException";

export class ArgumentOutOfRangeException extends ArgumentException {
    name: string = "Error.Kanro.Argument.OutOfRange";

    constructor(paramName: string, innerException?: Error) {
        super(`'${paramName}' is outside the allowable range.`, paramName, innerException);
    }
}