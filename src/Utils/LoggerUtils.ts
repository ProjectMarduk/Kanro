import { LogLevel, Style, AnsiStyle, Colors } from "../Logging";
import { TimeUtils } from "./TimeUtils";

export class LoggerUtils {
    static getLogLevelFlag(level: LogLevel) {
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

    static isErrorOutput(level: LogLevel) {
        return level > 1;
    }

    static buildLogString(namespace: string, level: LogLevel, message: string, interval: number, style: AnsiStyle): string {
        let lines = message.split('\n');
        let result = [];

        for (var index = 0; index < lines.length; index++) {
            var line = lines[index];

            if (index == 0 && interval != undefined) {
                let intervalString = Style`${style}${'+' + TimeUtils.getIntervalString(interval)}`;
                result.push(`[${TimeUtils.getTimeString(Date.now())}]  ${namespace} - ${LoggerUtils.getLogLevelFlag(level)} ${line} ${intervalString}`);
            }
            else {
                result.push(`[${TimeUtils.getTimeString(Date.now())}]  ${namespace} - ${LoggerUtils.getLogLevelFlag(level)} ${line}`);
            }
        }

        return result.join('\n');
    }
}