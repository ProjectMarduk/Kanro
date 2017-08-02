import * as Cluster from "cluster";
import { ILogger } from "./ILogger";
import { AnsiStyle } from "./AnsiStyle";
import { Application } from "../Application";
import { LogLevel } from "./LogLevel";
import { StringUtils } from "../Utils/index";

export class WorkerLogger implements ILogger {
    private namespace: string;
    private style: AnsiStyle;

    constructor(namespace: string) {
        let color = Number(Cluster.worker.id) % 7;

        this.style = AnsiStyle.create().foreground(color + 1);
        this.namespace = this.style.styling(StringUtils.rightPad(namespace, 16, ' '));
    }

    info(message: string) {
        process.send({ type: "log", namespace: this.namespace, message: message, level: LogLevel.info, style: this.style.styleString });
    }
    error(message: string) {
        process.send({ type: "log", namespace: this.namespace, message: message, level: LogLevel.error });
    }
    success(message: string) {
        process.send({ type: "log", namespace: this.namespace, message: message, level: LogLevel.success });
    }
    warning(message: string) {
        process.send({ type: "log", namespace: this.namespace, message: message, level: LogLevel.warning });
    }
}