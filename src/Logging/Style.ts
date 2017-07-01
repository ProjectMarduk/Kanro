import { AnsiStyle } from "./AnsiStyle";
import { StringUtils } from "../Utils";

export function Style(stringArray: TemplateStringsArray, ...values: any[]) {
    let result = [];

    let strings = stringArray.slice(0);
    let index = 0;

    for (index = 0; index < values.length; index++) {
        var element = values[index];

        result.push(strings[index]);
        if (element instanceof AnsiStyle) {
            if (strings[index + 1].length == 0) {
                if (index + 1 < values.length) {
                    result.push(element.styling(StringUtils.toString(values[index + 1])));
                    index += 1;
                    continue;
                }
            }
        }

        result.push(StringUtils.toString(element));
    }

    result.push(strings.pop());
    return result.join('');
}