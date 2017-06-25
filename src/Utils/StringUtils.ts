export class StringUtils {
    static pathSplit(path: string): string[] {
        let result: string[] = [];
        let current = "";
        if (!path.endsWith("/")) {
            path += "/";
        }

        let regex = 0;
        for (let char of path) {
            switch (char) {
                case "/":
                    if (regex > 0) {
                        current += char;
                        break;
                    }
                    if (current != undefined && current != "") {
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

    static rightPad(str, len, ch) {
        str = "" + str;
        ch = ("" + ch) || " ";
        let padLen = len - str.length;
        if (padLen <= 0) {
            return str;
        } else {
            return str + ch.repeat(padLen);
        }
    }

    static leftPad(str, len, ch) {
        str = "" + str;
        ch = ("" + ch) || " ";
        let padLen = len - str.length;
        if (padLen <= 0) {
            return str;
        } else {
            return ch.repeat(padLen) + str;
        }
    }
}