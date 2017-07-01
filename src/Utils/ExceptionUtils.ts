import { InvalidModuleException, InvalidNodeException, ArgumentNullException } from "../Exceptions";
import { Module, Node } from "../Core";

export class ExceptionUtils {
    public static throwIfInvalidModule(module: Module) {
        if (!(module instanceof Module)) {
            throw new InvalidNodeException(module);
        }
    }

    public static throwIfInvalidNode(node: Node) {
        if (!(node instanceof Node)) {
            throw new InvalidNodeException(node);
        }
    }

    public static throwIfNullOrUndefined(value: any, param: string) {
        if (value === null || value === undefined) {
            throw new ArgumentNullException(param);
        }
    }
}