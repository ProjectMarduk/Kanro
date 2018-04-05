import { KanroException } from "./KanroException";

export class InvalidModuleException extends KanroException {
    name: string = "Error.Kanro.Module.Invalid";
    module = undefined;

    constructor(module: any, message: string = "Invalid Kanro module.", innerException?: Error) {
        super(message, innerException);
        if (module == null) {
            this.message = "Kanro module not found";
        }
        this.module = module;
    }
}