import { BadReadError, InvalidDataError } from "./errors"
import { Inst, parseInst } from "./inst"
import { getMacros } from "./m4"
import { CodeAddr, Macro, Token } from "./types"
import { strToBytes } from "./util"

export default class AsmCode {
    name: string
    text: string
    lines: string[]
    inst: (Inst | null)[]
    labels: Record<string, CodeAddr>
    macros: Record<string, Macro>
    
    bytes: (number | null)[]
    byteLabels: Record<string, number>
    byteLines: number[]

    constructor(name: string, text: string) {
        this.name = name
        this.text = text
        this.lines = []
        this.inst = []
        this.labels = {}
        this.macros = {}
        this.bytes = []
        this.byteLabels = {}
        this.byteLines = []
        // console.log(this.lines.join("\n"))
    }

    readBytes(startIndex: number, numBytes: number): number[] {
        if ((startIndex + numBytes) > this.bytes.length) throw new BadReadError('EOF', {n: this.name, r: this.lines.length+1, c: 0, i: 0})
        const ret = this.bytes.slice(startIndex, startIndex+numBytes)
        if (ret.indexOf(null) >= 0) throw new BadReadError(null, {n: this.name, r: 0, c: 0, i: 0})
        return ret as number[]
    }


    toAddr(i: number): CodeAddr {
        if (i >= this.text.length) return { n: this.name, i, r: 1, c: 1 }
        let row = 1
        let sum = 0
        let col = 0
        for (const line of this.lines) {
            sum += line.length + 1

            if (i < sum) {
                // console.log(i, sum, line.length, line)
                col = i - (sum - (line.length + 1)) + 1
                break
            }
            row++
        }
        return { n: this.name, i, r: row, c: col }
    }

    compileLine(line: string, row: number): Inst | null {
        const tokens: Token[] = []
        const lasti = line.length
        let token: Token = { value: "", addr: { n: this.name, i: 0, c: 1, r: row } }
        let is_string = false
        let brackets = []
        let col = 0

        const tokenEnd = () => {
            if (token.value.length > 0) {
                token.addr.c = col
                token.addr.i = 0
                tokens.push(token)
                token = { value: "", addr: { n: this.name, i: 0, c: 1, r: row } }
            }
        }
        for (; col < lasti; col++) {
            const c = line[col]
            if (c === ' ' || c === '\t' || c === ',') {
                if (!is_string && brackets.length === 0) {
                    tokenEnd()
                }
            } else if (c === '"') {
                token.value += c
                if (is_string) {
                    tokenEnd()
                    is_string = false
                } else {
                    is_string = true
                }
            } else if (c === '[') {
                token.value += c
                if (!is_string) {
                    brackets.push('[')
                }
            } else if (c === ']') {
                token.value += c
                if (!is_string) {
                    brackets.pop()
                }
            } else {
                token.value += c
            }
        }

        tokenEnd()

        this.byteLines[row-1] = this.bytes.length

        let type = tokens[0]
        if (!type) return null
        else if (type.value[type.value.length - 1] === ':') {
            const label = type.value.substring(0, type.value.length - 1)
            this.byteLabels[label] = this.bytes.length
            this.labels[label] = type.addr
            tokens.shift()
        }

        type = tokens[0]
        if (!type) return null
        else if (type.value[0] === '.') {
            if (type.value === '.string') {
                for (const token of tokens.slice(1)) {
                    const s = JSON.parse(token.value)
                    if (typeof s !== 'string') throw new InvalidDataError(token)
                    this.bytes.push(...strToBytes(s))
                }
            }
            return null
        } else {
            this.bytes.push(null, null, null, null)
            return parseInst(tokens)
        }
    }

    compileAll() {
        this.lines = this.text.split('\n')
        this.macros = getMacros(this)
        this.bytes = []
        this.byteLines = this.lines.map(() => 0)
        this.inst = this.lines
            .map(l => l.split("//")[0].trimEnd())
            .map((line, i) => this.compileLine(line, i + 1))

        // console.log(this.bytes)
        // const m = this.macros['read_r']
        // console.log(JSON.stringify(this.text.substring(m.defStart.i, m.defEnd.i)))
    }

}