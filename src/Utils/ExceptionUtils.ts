import { InvalidModuleException, InvalidNodeException, ArgumentNullException } from "../Exceptions";
import { Module, Node } from "../Core";

export class ExceptionUtils {
    static throwIfInvalidModule(module: Module): void {
        if (!(module instanceof Module)) {
            throw new InvalidModuleException(module);
        }
    }

    static throwIfInvalidNode(node: Node): void {
        if (!(node instanceof Node)) {
            throw new InvalidNodeException(node);
        }
    }

    static throwIfNullOrUndefined(value: any, param: string): void {
        if (value === null || value === undefined) {
            throw new ArgumentNullException(param);
        }
    }
}