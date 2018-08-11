import * as Chevrotain from "chevrotain";
import { OrderedTokenType } from "./OrderedTokenType"

declare global {
    interface Object {
        apply<T>(apply: (T) => void): T;
    }
}

Object.prototype.apply = function <T>(apply: (T) => void): T {
    apply(this)
    return this
}

export const LineBreaker = Chevrotain.createToken({
    name: "LineBreaker",
    pattern: /[\r\n]/,
    group: Chevrotain.Lexer.SKIPPED
}).apply<OrderedTokenType>(it => it.order = 0);

export const WhiteSpace = Chevrotain.createToken({
    name: "WhiteSpace",
    pattern: /[ \t]+/,
    group: Chevrotain.Lexer.SKIPPED
}).apply<OrderedTokenType>(it => it.order = 100);

export const Identifier = Chevrotain.createToken({
    name: "Identifier",
    pattern: /[a-zA-Z_][a-zA-Z0-9_]*|`[^\r\n]+`/
}).apply<OrderedTokenType>(it => it.order = 910);

export const Kanro = Chevrotain.createToken({
    name: "Kanro",
    pattern: /kanro/,
    longer_alt: Identifier
}).apply<OrderedTokenType>(it => it.order = 200);

export const Npm = Chevrotain.createToken({
    name: "Npm",
    pattern: /npm/,
    longer_alt: Identifier
}).apply<OrderedTokenType>(it => it.order = 300);

export const LCurly = Chevrotain.createToken({
    name: "LCurly",
    pattern: /{/,
    label: "'{'"
}).apply<OrderedTokenType>(it => it.order = 500);

export const RCurly = Chevrotain.createToken({
    name: "RCurly",
    pattern: /}/,
    label: "'}'"
}).apply<OrderedTokenType>(it => it.order = 600);

export const True = Chevrotain.createToken({
    name: "True",
    pattern: /true/,
    longer_alt: Identifier
}).apply<OrderedTokenType>(it => it.order = 700);

export const False = Chevrotain.createToken({
    name: "False",
    pattern: /false/,
    longer_alt: Identifier
}).apply<OrderedTokenType>(it => it.order = 800);

export const Null = Chevrotain.createToken({
    name: "Null",
    pattern: /null/,
    longer_alt: Identifier
}).apply<OrderedTokenType>(it => it.order = 900);

export const StringValue = Chevrotain.createToken({
    name: "StringValue",
    pattern: /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
}).apply<OrderedTokenType>(it => it.order = 1000);

export const VersionValue = Chevrotain.createToken({
    name: "VersionValue",
    pattern: /\*|[\^~]?[0-9]+(?:.[0-9]+){0,2}(?:-[A-Za-z0-9]+)?|latest/
}).apply<OrderedTokenType>(it => it.order = 1100);

export const NumberValue = Chevrotain.createToken({
    name: "NumberValue",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
}).apply<OrderedTokenType>(it => it.order = 1200);