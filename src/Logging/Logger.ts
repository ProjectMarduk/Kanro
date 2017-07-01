import { StringUtils } from '../Utils';
import { Colors } from './Colors';
import { Style } from "./Style";
import { AnsiStyle } from "./AnsiStyle";

export class Logger {
    private console: Console;
    private namespace: string;
    private color: Colors;

    private static time: number = -1;

    constructor(namespace: string, color: Colors, out?: NodeJS.WritableStream, err?: NodeJS.WritableStream) {
        if (out == null) {
            this.console = console;
        }
        else {
            this.console = new console.Console(out, err);
        }
        this.color = color;
        this.namespace = StringUtils.rightPad(namespace, 16, ' ');
    }

    public info(message: string) {
        this.log(message, Style`${AnsiStyle.create().foreground(Colors.blue)}${"[·]"}`, m => this.console.log(m));
    }

    public error(message: string) {
        this.log(message, Style`${AnsiStyle.create().foreground(Colors.red)}${"[x]"}`, m => this.console.error(m));
    }

    public success(message: string) {
        this.log(message, Style`${AnsiStyle.create().foreground(Colors.green)}${"[+]"}`, m => this.console.log(m));
    }

    public warning(message: string) {
        this.log(message, Style`${AnsiStyle.create().foreground(Colors.yellow)}${"[!]"}`, m => this.console.error(m));
    }

    private log(message: string, flag: string, logFunc: Function) {
        let lines = message.replace('\r\n', '\n').replace('\r', '\n').split('\n');
        let now = Date.now();
        if (Logger.time < 0) {
            Logger.time = now;
        }

        let timeInfos = [Style` ${AnsiStyle.create().bold().foreground(this.color)}${`+${now - Logger.time}ms`}`];

        for (let line of lines) {
            let namespaceInfo = Style`  ${AnsiStyle.create().bold().foreground(this.color)}${this.namespace}`;

            let log = `${namespaceInfo} - ${flag} ${line}`;
            let timeInfo = timeInfos.pop();
            if (timeInfo != undefined) {
                log += timeInfo;
            }

            logFunc(log);
        }
    }
}