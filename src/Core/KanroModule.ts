import { ExecutorType, BaseRequestHandler, BaseRequestDiverter, BaseRequestReplicator, BaseResponder, BaseFileResponder, BaseResponseHandler, BaseFuse, BaseExceptionHandler, BaseGlobalRequestHandler, BaseGlobalResponseHandler, BaseGlobalExceptionHandler, IExecutorInfo, IExecutor } from "../Executors";
import { Router, MethodRouter } from "../Router";
import { IExecutorContainer } from "../Containers";
import { IModule } from "./IModule";
import { IModuleInfo } from "./IModuleInfo";
import { IApplicationContext } from "./IApplicationContext";

export class KanroModule implements IModule {
    dependencies: IModuleInfo[];
    context: IApplicationContext;
    executorInfos: { [name: string]: IExecutorInfo; };
    async getExecutor(config: IExecutorContainer): Promise<IExecutor> {
        switch (config.name) {
            case "KanroRouter":
                return new Router(<any>config);
            case "ModuleManager":
                return this.context.moduleManager;
            case "ServiceManager":
                return this.context.serviceManager;
            case "LoggerManager":
                return this.context.LoggerManager;
            case "MethodRouter":
                return new MethodRouter(<any>config);
            case "BaseRequestHandler":
                return new BaseRequestHandler(<any>config);
            case "BaseRequestDiverter":
                return new BaseRequestDiverter(<any>config);
            case "BaseRequestReplicator":
                return new BaseRequestReplicator(<any>config);
            case "BaseResponder":
                return new BaseResponder(<any>config);
            case "BaseFileResponder":
                return new BaseFileResponder(<any>config);
            case "BaseResponseHandler":
                return new BaseResponseHandler(<any>config);
            case "BaseFuse":
                return new BaseFuse(<any>config);
            case "BaseExceptionHandler":
                return new BaseExceptionHandler(<any>config);
            case "BaseGlobalRequestHandler":
                return new BaseGlobalRequestHandler(<any>config);
            case "BaseGlobalResponseHandler":
                return new BaseGlobalResponseHandler(<any>config);
            case "BaseGlobalExceptionHandler":
                return new BaseGlobalExceptionHandler(<any>config);
        }
        return undefined;
    }

    constructor(context: IApplicationContext) {
        this.context = context;
        this.executorInfos = {
            KanroRouter: { type: ExecutorType.RequestDiverter, name: "KanroRouter" },
            ModuleManager: { type: ExecutorType.Service, name: "ModuleManager" },
            ServiceManager: { type: ExecutorType.Service, name: "ServiceManager" },
            LoggerManager: { type: ExecutorType.Service, name: "LoggerManager" },
            MethodRouter: { type: ExecutorType.RequestDiverter, name: "MethodRouter" },
            BaseRequestHandler: { type: ExecutorType.RequestHandler, name: "BaseRequestHandler" },
            BaseRequestDiverter: { type: ExecutorType.RequestDiverter, name: "BaseRequestDiverter" },
            BaseRequestReplicator: { type: ExecutorType.RequestReplicator, name: "BaseRequestReplicator" },
            BaseResponder: { type: ExecutorType.Responder, name: "BaseResponder" },
            BaseFileResponder: { type: ExecutorType.Responder, name: "BaseFileResponder" },
            BaseResponseHandler: { type: ExecutorType.ResponseHandler, name: "BaseResponseHandler" },
            BaseFuse: { type: ExecutorType.Fuse, name: "BaseFuse" },
            BaseExceptionHandler: { type: ExecutorType.ExceptionHandler, name: "BaseExceptionHandler" },
            BaseGlobalRequestHandler: { type: ExecutorType.GlobalRequestHandler, name: "BaseGlobalRequestHandler" },
            BaseGlobalResponseHandler: { type: ExecutorType.GlobalResponseHandler, name: "BaseGlobalResponseHandler" },
            BaseGlobalExceptionHandler: { type: ExecutorType.GlobalExceptionHandler, name: "BaseGlobalExceptionHandler" },
        };
    }
}