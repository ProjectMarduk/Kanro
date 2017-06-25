import { KanroException } from "./KanroException";

export class InvalidRouterConfigException extends KanroException {
    name: string = "Error.Kanro.RouterConfig.Invalid";

    constructor(message: string = "Invalid router config be provided.", innerException: Error = undefined) {
        super(message, innerException);
    }
}