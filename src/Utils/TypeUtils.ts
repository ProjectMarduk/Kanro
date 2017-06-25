import { IModule } from "../Core/index";
import { IExecutor, IRequestHandler, ExecutorType, IFuse, IRequestDiverter, IRequestReplicator, IResponder, IResponseHandler, IExceptionHandler, IGlobalRequestHandler, IGlobalResponseHandler, IGlobalExceptionHandler } from "../Executors/index";

export class TypeUtils {
    /**
     * Check a module is a valid Kanro module or not.
     * 
     * @static
     * @param {IModule} module 
     * @returns 
     * 
     * @memberOf TypeUtils
     */
    static isValidKanroModule(module: IModule) {
        return module == undefined || module.getExecutor != undefined &&
            typeof (module.getExecutor) == 'function' &&
            module.executorInfos != undefined;
    }

    /**
     * Check a executor is a valid Kanro executor or not.
     * 
     * @static
     * @param {IExecutor} executor 
     * @returns 
     * 
     * @memberOf TypeUtils
     */
    static isValidExecutor(executor: IExecutor) {
        if (executor == undefined || executor.name == undefined || executor.type == undefined) {
            return false;
        }

        switch (executor.type) {
            case ExecutorType.RequestHandler:
                let requestHandler = <IRequestHandler>executor;
                return typeof (requestHandler.handler) == 'function';
            case ExecutorType.RequestDiverter:
                let requestDiverter = <IRequestDiverter>executor;
                return typeof (requestDiverter.shunt) == 'function';
            case ExecutorType.RequestReplicator:
                let requestReplicator = <IRequestReplicator>executor;
                return typeof (requestReplicator.copy) == 'function';
            case ExecutorType.Responder:
                let responder = <IResponder>executor;
                return typeof (responder.respond) == 'function';
            case ExecutorType.ResponseHandler:
                let responseHandler = <IResponseHandler>executor;
                return typeof (responseHandler.handler) == 'function';
            case ExecutorType.ExceptionHandler:
                let exceptionHandler = <IExceptionHandler>executor;
                return typeof (exceptionHandler.handler) == 'function';
            case ExecutorType.Fuse:
                let fuse = <IFuse>executor;
                return typeof (fuse.fusing) == 'function';
            case ExecutorType.GlobalRequestHandler:
                let globalRequestHandler = <IGlobalRequestHandler>executor;
                return typeof (globalRequestHandler.handler) == 'function';
            case ExecutorType.GlobalResponseHandler:
                let globalResponseHandler = <IGlobalResponseHandler>executor;
                return typeof (globalResponseHandler.handler) == 'function';
            case ExecutorType.GlobalExceptionHandler:
                let globalExceptionHandler = <IGlobalExceptionHandler>executor;
                return typeof (globalExceptionHandler.handler) == 'function';
            case ExecutorType.Service:
                return true;
            default:
                return false;
        }
    }
}