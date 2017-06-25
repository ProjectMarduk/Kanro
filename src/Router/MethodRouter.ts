import { BaseExecutor, IRequestDiverter, ExecutorType, IService } from "../Executors";
import { IRequest } from "../Http";
import { IExecutorContainer, IRequestDiverterContainer } from "../Containers";
import { MethodNotAllowedException } from "../Exceptions";

export class MethodRouter extends BaseExecutor implements IRequestDiverter {
    async shunt(request: IRequest, executors: IExecutorContainer[]): Promise<IExecutorContainer> {
        let method = request.method.toUpperCase();

        if (this.methods[method] != undefined) {
            return this.methods[method];
        }

        throw new MethodNotAllowedException();
    }

    type: ExecutorType.RequestDiverter = ExecutorType.RequestDiverter;
    dependencies: { [name: string]: IService; } = {};
    name: string = "MethodRouter";

    methods: { [method: string]: IExecutorContainer } = {};

    constructor(config: IRequestDiverterContainer) {
        super(config);

        config.next = [];

        for (var key in config) {
            switch (key.toUpperCase()) {
                case "OPTIONS":
                case "GET":
                case "HEAD":
                case "POST":
                case "PUT":
                case "DELETE":
                case "TRACE":
                case "CONNECT":
                case "PATCH":
                    this.methods[key.toUpperCase()] = config[key];
                    config.next.push(config[key]);
                    break;
                default:
                    if (key.startsWith("-")) {
                        this.methods[key.slice(1).toUpperCase()] = config[key];
                        config.next.push(config[key]);
                    }
                    break;
            }
        }
    }
}