import { StringUtils } from "./StringUtils";

export class TimeUtils {

    public static getIntervalString(interval: number): string {
        if (interval < 1000) {
            return `${interval}ms`;
        }
        else if (interval < 60 * 1000) {
            return `${(interval / 1000).toFixed(2)}s`;
        }
        else if (interval < 60 * 60 * 1000) {
            return `${(interval / 1000 / 60).toFixed(0)}m${((interval / 1000) % 60).toFixed(0)}s`;
        }
        else {
            return `${(interval / 1000 / 60 / 60).toFixed(0)}h${((interval / 1000 / 60) % 60).toFixed(0)}m${((interval / 1000) % 60).toFixed(0)}s`;
        }
    }

    public static getTimePassed(time: number): number {
        if (time < 0) {
            return 0;
        }
        return Date.now() - time;
    }

    public static getTimePassedString(time: number): string {
        return TimeUtils.getIntervalString(TimeUtils.getTimePassed(time));
    }

    public static getTimeString(time: number) {
        let date = new Date(time);
        return `${StringUtils.leftPad(date.getMonth() + 1, 2, '0')}/${StringUtils.leftPad(date.getDate(), 2, '0')} ${StringUtils.leftPad(date.getHours(), 2, '0')}:${StringUtils.leftPad(date.getMinutes(), 2, '0')}:${StringUtils.leftPad(date.getSeconds(), 2, '0')}`;
    }
}