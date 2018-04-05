import { ArgumentException } from "./ArgumentException";

export class ArgumentNullException extends ArgumentException {
    name: string = "Error.Kanro.Argument.Null";

    constructor(paramName: string, innerException?: Error) {
        super(`'${paramName}' cannot be null or undefined.`, paramName, innerException);
    }
}