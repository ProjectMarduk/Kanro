import * as Chevrotain from "chevrotain";
import * as Tokens from "./Token"
import { OrderedTokenType } from "./OrderedTokenType";

var allTokens = Object.keys(Tokens).map(it => <OrderedTokenType>Tokens[it]).sort((a, b) => a.order - b.order);

export var KanroDSLLexer = new Chevrotain.Lexer(allTokens);

export class KanroConfigParser extends Chevrotain.Parser {
    constructor(input: Chevrotain.IToken[]) {
        super(input, allTokens, {
            recoveryEnabled: true,
            outputCst: true
        })
        this.performSelfAnalysis();
    }

    public kanro = this.RULE("kanro", () => {
        this.CONSUME(Tokens.Kanro)
        this.CONSUME(Tokens.LCurly)
        this.MANY_SEP({
            SEP: Tokens.LineBreaker,
            DEF: () => {
                this.OR([
                    {
                        "ALT": () => this.SUBRULE(this.npm)
                    },
                    {
                        "ALT": () => this.SUBRULE(this.config)
                    }
                ])
            }
        })
        this.CONSUME(Tokens.RCurly)
    });

    public config = this.RULE("config", () => {
        this.CONSUME(Tokens.Identifier)
        this.SUBRULE(this.value)
    });

    public npm = this.RULE("npm", () => {
        this.CONSUME(Tokens.Npm)
        this.CONSUME(Tokens.StringValue)
    });

    public value = this.RULE("value", () => {
        this.OR([
            {
                ALT: () => this.CONSUME(Tokens.StringValue)
            },
            {
                ALT: () => this.CONSUME(Tokens.NumberValue)
            },
            {
                ALT: () => this.CONSUME(Tokens.VersionValue)
            },
            {
                ALT: () => this.CONSUME(Tokens.True)
            },
            {
                ALT: () => this.CONSUME(Tokens.False)
            },
            {
                ALT: () => this.CONSUME(Tokens.Null)
            }
        ])
    });

    public test = this.RULE("test", () => {
        this.MANY_SEP({
            SEP: Tokens.LineBreaker,
            DEF: () => {
                this.OR([
                    {
                        "ALT": () => this.SUBRULE(this.npm)
                    },
                    {
                        "ALT": () => this.SUBRULE(this.config)
                    }
                ])
            }
        })
    });
}