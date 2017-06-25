import { TypeUtils } from "./TypeUtils";
import { InvalidModuleException, InvalidExecutorException } from "../Exceptions";
import { IExecutor } from "../Executors";
import { IModule } from "../Core";

export class ExceptionUtils {
    public static throwIfInvalidModule(module: IModule) {
        if (!TypeUtils.isValidKanroModule(module)) {
            throw new InvalidModuleException(module);
        }
    }

    public static throwIfInvalidExecutor(executor: IExecutor) {
        if (!TypeUtils.isValidExecutor(executor)) {
            throw new InvalidExecutorException(executor);
        }
    }
}