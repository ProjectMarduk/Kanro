import { StringUtils } from "./StringUtils";

export class TimeUtils {

    static getIntervalString(interval: number): string {
        if (interval < 1000) {
            return `${interval}ms`;
        } else if (interval < 60 * 1000) {
            return `${(interval / 1000).toFixed(2)}s`;
        } else if (interval < 60 * 60 * 1000) {
            return `${(interval / 1000 / 60).toFixed(0)}m${((interval / 1000) % 60).toFixed(0)}s`;
        } else {
            // tslint:disable-next-line:max-line-length
            return `${(interval / 1000 / 60 / 60).toFixed(0)}h${((interval / 1000 / 60) % 60).toFixed(0)}m${((interval / 1000) % 60).toFixed(0)}s`;
        }
    }

    static getTimePassed(time: number): number {
        if (time < 0) {
            return 0;
        }
        return Date.now() - time;
    }

    static getTimePassedString(time: number): string {
        return TimeUtils.getIntervalString(TimeUtils.getTimePassed(time));
    }

    static getTimeString(time: number): string {
        let date: Date = new Date(time);
        // tslint:disable-next-line:max-line-length
        return `${StringUtils.leftPad((date.getMonth() + 1).toString(), 2, "0")}/${StringUtils.leftPad(date.getDate().toString(), 2, "0")} ${StringUtils.leftPad(date.getHours().toString(), 2, "0")}:${StringUtils.leftPad(date.getMinutes().toString(), 2, "0")}:${StringUtils.leftPad(date.getSeconds().toString(), 2, "0")}`;
    }
}