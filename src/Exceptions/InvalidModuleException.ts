import { KanroException } from "./KanroException";

export class InvalidModuleException extends KanroException {
    public name: string = "Error.Kanro.Module.Invalid";
    public module = undefined;

    constructor(module: any, message: string = "Invalid Kanro module.", innerException: Error = undefined) {
        super(message, innerException);
        if (module == undefined) {
            this.message = "Kanro module not found";
        }
        this.module = module;
    }
}