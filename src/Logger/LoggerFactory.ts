import * as Debug from "debug";
import { ILogger } from "./ILogger";
import { StringUtils } from "../Utils";

export class LoggerFactory {
    static buildLogger(key: string): ILogger {
        return new Logger(key);
    }
}

class Logger implements ILogger {
    private static debug = Debug;
    private static debugInitialized: boolean = false;
    private static namespaceCount: number = 0;
    private static namespaceColor: { [name: string]: number } = {};
    private static Colors = [0x3, 0x4, 0x5, 0x6, 0x1, 0x2, 0x7];
    private static selectColor(namespace: string) {
        if (Logger.namespaceColor[namespace] === undefined) {
            Logger.namespaceColor[namespace] = Logger.namespaceCount;
            Logger.namespaceCount++;
        }
        return Logger.Colors[Logger.namespaceColor[namespace] % Logger.Colors.length];
    }

    private debugger: Debug.IDebugger;

    constructor(namespace: string) {
        if (!Logger.debugInitialized) {
            Logger.debug["colors"] = [0x3, 0x4, 0x5, 0x6, 0x1, 0x2, 0x7];
            Logger.debug["formatArgs"] = function (args) {
                var name = this.namespace;
                var useColors = this.useColors;

                if (args[1] === undefined) {
                    args[1] = LoggerLevel.Info;
                }

                var c: number = Logger.selectColor(name);
                var prefix = '  \u001b[3' + c + 'm' + StringUtils.rightPad(name, 16, ' ') + '- ' + '\u001b[0m';
                let levelPrefix: string;

                switch (args[1]) {
                    case LoggerLevel.Success:
                        levelPrefix = '\u001b[32m' + '[+] ' + '\u001b[0m';
                        break;
                    case LoggerLevel.Error:
                        levelPrefix = '\u001b[31m' + '[x] ' + '\u001b[0m';
                        break;
                    default:
                        levelPrefix = '\u001b[37m' + '[!] ' + '\u001b[0m';
                        break;
                }

                args.pop();
                args[0] = prefix + levelPrefix + args[0].split('\n').join('\n' + prefix);
                args.push('\u001b[3' + c + 'm+' + Logger.debug["humanize"](this.diff) + '\u001b[0m');
            }
        }

        this.debugger = Logger.debug(namespace);
    }
    success(message: string) {
        this.debugger(message, LoggerLevel.Success);
    }
    error(message: string) {
        this.debugger(message, LoggerLevel.Error);
    }
    info(message: string) {
        this.debugger(message, LoggerLevel.Info);
    }

    static App = new Logger("Kanro:App");
    static Module = new Logger("Kanro:Module");
    static Http = new Logger("Kanro:HTTP");
    static NPM = new Logger("Kanro:NPM");
    static Config = new Logger("Kanro:Config");
    static Router = new Logger("Kanro:Router");
    static Service = new Logger("Kanro:Service");
}

enum LoggerLevel {
    Info, Success, Error
}