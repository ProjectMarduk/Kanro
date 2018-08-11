import * as DSL from "./DSL"

const dsl = `
npm"http://"
test"test"
`

var result = DSL.KanroDSLLexer.tokenize(dsl);

var parser = new DSL.KanroConfigParser(result.tokens);

parser.test()

if (parser.errors.length > 0) {
    throw new Error("sad sad panda, Parsing errors detected")
}

parser