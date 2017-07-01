import { Colors } from "./Colors";

export class AnsiStyle {
    private styleString = "";
    private styleEnable = true;

    public bold(): AnsiStyle {
        return this.addStyle('1');
    }

    public faint(): AnsiStyle {
        return this.addStyle('2');
    }

    public italic(): AnsiStyle {
        return this.addStyle('3');
    }

    public underline(): AnsiStyle {
        return this.addStyle('4');
    }

    public blinkSlow(): AnsiStyle {
        return this.addStyle('5');
    }

    public blinkRapid(): AnsiStyle {
        return this.addStyle('6');
    }

    public negative(): AnsiStyle {
        return this.addStyle('7');
    }

    public conceal(): AnsiStyle {
        return this.addStyle('8');
    }

    public strikeThrough(): AnsiStyle {
        return this.addStyle('9');
    }

    public foreground(color: Colors): AnsiStyle {
        return this.addStyle('3' + color);
    }

    public background(color: Colors): AnsiStyle {
        return this.addStyle('4' + color);
    }

    public styling(string: string): string {
        if(!this.styleEnable){
            return string;
        }
        return this.styleString + string + '\x1b[0m';
    }

    public addStyle(styleCode: string): AnsiStyle {
        this.styleString += `\x1b[${styleCode}m`;
        return this;
    }

    public enable(styleEnable = true): AnsiStyle{
        this.styleEnable  = styleEnable;
        return this;
    }

    public static create() {
        return new AnsiStyle();
    }
}