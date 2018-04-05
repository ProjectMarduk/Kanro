export class StringUtils {
    static routerPathSplit(path: string): string[] {
        let result: string[] = [];
        let current: string = "";
        if (!path.endsWith("/")) {
            path += "/";
        }

        let regex: number = 0;
        for (let char of path) {
            switch (char) {
                case "/":
                    if (regex > 0) {
                        current += char;
                        break;
                    }
                    if (current != null && current !== "") {
                        result.push(current);
                        current = "";
                    }
                    break;
                case "{":
                    current += char;
                    regex++;
                    break;
                case "}":
                    current += char;
                    regex--;
                    break;
                default:
                    current += char;
                    break;
            }
        }

        return result;
    }

    static rightPad(str: string, len: number, ch: string): string {
        str = "" + str;
        ch = ("" + ch) || " ";
        let padLen: number = len - str.length;
        if (padLen <= 0) {
            return str;
        } else {
            return str + ch.repeat(padLen);
        }
    }

    static leftPad(str: string, len: number, ch: string): string {
        str = "" + str;
        ch = ("" + ch) || " ";
        let padLen: number = len - str.length;
        if (padLen <= 0) {
            return str;
        } else {
            return ch.repeat(padLen) + str;
        }
    }

    static toString(obj: any): string {
        if (obj === null) {
            return "null";
        }

        if (obj === undefined) {
            return "undefined";
        }

        return obj.toString();
    }

    static removeStyling(str: string): string {
        let result: string = str.replace(/\[[0-9]+m/g, "");
        return result;
    }
}