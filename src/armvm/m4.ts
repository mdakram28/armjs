import AsmCode from "./code";
import { BracketMismatchError, BracketUnclosedError, WrongNumberOfArgs } from "./errors";
import { Macro } from "./types";


const MACRO_DEFS = [{
    regex: [
        /[^A-Za-z_]define\(/g,
        /^define\(/g,
    ],
    type: 'define'
}]

// TODO: Skips macro from 0th index
export function getMacros(code: AsmCode): Record<string, Macro> {
    const macros: Record<string, Macro> = {}

    function extract(i: number): [string[], number] {
        const stack = ['(']
        let is_string = false
        let arg = ""
        let args = []
        while (stack.length > 0 && i < code.text.length) {
            const c = code.text[i]
            arg += c
            switch (c) {
                case '(':
                    if (!is_string) {
                        stack.push('(')
                    }
                    break
                case ')':
                    if (!is_string) {
                        if (stack.pop() !== '(') throw new BracketMismatchError()
                    }
                    break
                case '`':
                    is_string = true
                    break
                case "'":
                    is_string = false
                    break
                case ',':
                    if (!is_string) {
                        args.push(arg.substring(0, arg.length-1))
                        arg = ""
                    }
                    break
                default:
            }
            i++
        }
        if (stack.length > 0) throw new BracketUnclosedError()

        args.push(arg.substring(0, arg.length-1))
        args = args
            .map(arg => arg.trim())
            .map(arg => arg[0] === "`" ? arg.substring(1, arg.length-1) : arg)
        // console.log(args)
        return [args, i]
    }

    for (const macroDef of MACRO_DEFS) {
        for (const regex of macroDef.regex) {
            var result;
            while ((result = regex.exec(code.text)) !== null) {
                // console.log(result)
                const [args, defEnd] = extract(result.index + result[0].length)
                if (macroDef.type === 'define') {
                    if (args.length !== 2) throw new WrongNumberOfArgs()
                    macros[args[0]] = {
                        "replace": args[1],
                        defStart: code.toAddr(result.index + result[0].length - macroDef.type.length - 1),
                        defEnd: code.toAddr(defEnd)
                    }

                }
            }
        }
    }

    return macros
}