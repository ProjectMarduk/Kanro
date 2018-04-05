import { KanroException } from "./KanroException";

export class InvalidConfigException extends KanroException {
    name: string = "Error.Kanro.Config.Invalid";

    constructor(config: string, message?: string, innerException?: Error) {
        super(
            `Config '${config}' not matched with schema, check your config file${message == null ? "" : `, message: '${message}'`}.`,
            innerException);
    }
}