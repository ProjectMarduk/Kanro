import { Colors } from "./Colors";

export class AnsiStyle {
    styleString = "";
    private styleEnable = true;

    bold(): AnsiStyle {
        return this.addStyle("1");
    }

    faint(): AnsiStyle {
        return this.addStyle("2");
    }

    italic(): AnsiStyle {
        return this.addStyle("3");
    }

    underline(): AnsiStyle {
        return this.addStyle("4");
    }

    blinkSlow(): AnsiStyle {
        return this.addStyle("5");
    }

    blinkRapid(): AnsiStyle {
        return this.addStyle("6");
    }

    negative(): AnsiStyle {
        return this.addStyle("7");
    }

    conceal(): AnsiStyle {
        return this.addStyle("8");
    }

    strikeThrough(): AnsiStyle {
        return this.addStyle("9");
    }

    foreground(color: Colors): AnsiStyle {
        return this.addStyle("3" + color);
    }

    background(color: Colors): AnsiStyle {
        return this.addStyle("4" + color);
    }

    styling(string: string): string {
        if (!this.styleEnable) {
            return string;
        }
        return this.styleString + string + "\x1b[0m";
    }

    addStyle(styleCode: string): AnsiStyle {
        this.styleString += `\x1b[${styleCode}m`;
        return this;
    }

    enable(styleEnable: boolean = true): AnsiStyle {
        this.styleEnable = styleEnable;
        return this;
    }

    static create(str: string = ""): AnsiStyle {
        let result: AnsiStyle = new AnsiStyle();
        result.styleString = str;
        return result;
    }
}