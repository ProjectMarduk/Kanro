import { LogLevel, Style, AnsiStyle, Colors } from "../Logging";
import { TimeUtils } from "./TimeUtils";

export class LoggerUtils {
    static getLogLevelFlag(level: LogLevel): string {
        switch (level) {
            case LogLevel.info:
                return Style`${AnsiStyle.create().foreground(Colors.blue)}${"[·]"}`;
            case LogLevel.success:
                return Style`${AnsiStyle.create().foreground(Colors.green)}${"[+]"}`;
            case LogLevel.warning:
                return Style`${AnsiStyle.create().foreground(Colors.yellow)}${"[!]"}`;
            case LogLevel.error:
                return Style`${AnsiStyle.create().foreground(Colors.red)}${"[x]"}`;
        }
    }

    static isErrorOutput(level: LogLevel): boolean {
        return level > 1;
    }

    static buildLogString(namespace: string, level: LogLevel, message: string, interval: number, style: AnsiStyle): string {
        let lines: string[] = message.split("\n");
        let result: string[] = [];

        for (let index: number = 0; index < lines.length; index++) {
            let line: string = lines[index];

            if (index === 0 && interval != null) {
                let intervalString: String = Style`${style}${"+" + TimeUtils.getIntervalString(interval)}`;
                // tslint:disable-next-line:max-line-length
                result.push(`[${TimeUtils.getTimeString(Date.now())}]  ${namespace} - ${LoggerUtils.getLogLevelFlag(level)} ${line} ${intervalString}`);
            } else {
                result.push(`[${TimeUtils.getTimeString(Date.now())}]  ${namespace} - ${LoggerUtils.getLogLevelFlag(level)} ${line}`);
            }
        }

        return result.join("\n");
    }
}