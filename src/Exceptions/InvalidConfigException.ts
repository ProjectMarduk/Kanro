import { KanroException } from "./KanroException";

export class InvalidConfigException extends KanroException {
    name: string = "Error.Kanro.Config.Invalid";

    constructor(config: string, message: string = undefined, innerException: Error = undefined) {
        super(`Config '${config}' not matched with schema, check your config file${message == undefined ? "" : `, message: '${message}'`}.`, innerException);
    }
}