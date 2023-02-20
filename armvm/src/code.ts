import { AsmSyntaxError, BadReadError, InvalidDataError, LabelNotFoundError } from "./errors"
import "./inst"
import { parseInst } from "./inst/inst"
import { getMacros } from "./m4"
import { CodeAddr, Macro, RamVal, Token } from "./types"
import { strToBytes } from "./util"

export default class AsmCode {
    name: string
    text: string
    lines: string[]
    // private inst: (Inst | null)[]
    labels: Record<string, CodeAddr>
    macros: Record<string, Macro>

    bytes: RamVal[]
    // byteLabels: Record<string, number>
    // byteLines: number[]
    
    globalTokens: Record<string, Token>

    constructor(name: string, text: string) {
        this.name = name
        this.text = text
        this.lines = []
        // this.inst = []
        this.labels = {}
        this.macros = {}
        this.bytes = []
        // this.byteLabels = {}
        // this.byteLines = []

        this.globalTokens = {}
        // console.log(this.lines.join("\n"))
    }

    readBytes(startIndex: number, numBytes: number): number[] {
        if ((startIndex + numBytes) > this.bytes.length) throw new BadReadError('EOF', { codeName: this.name, row: this.lines.length + 1, col: 0, textIndex: 0 })
        const ret = this.bytes.slice(startIndex, startIndex + numBytes)
        if (ret.indexOf(null) >= 0) throw new BadReadError(null, { codeName: this.name, row: 0, col: 0, textIndex: 0 })
        return ret as number[]
    }


    toAddr(i: number): CodeAddr {
        if (i >= this.text.length) return { codeName: this.name, textIndex: i, row: 1, col: 1 }
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
        return { codeName: this.name, textIndex: i, row: row, col: col }
    }

    compileLine(line: string, row: number): void {
        const tokens: Token[] = []
        const lasti = line.length
        let token: Token = { value: "", addr: { codeName: this.name, textIndex: 0, col: 1, row: row } }
        let is_string = false
        let brackets = []
        let col = 0

        const tokenEnd = () => {
            if (token.value.length > 0) {
                token.addr.col = col + 1 - token.value.length
                token.addr.textIndex = 0
                tokens.push(token)
                token = { value: "", addr: { codeName: this.name, textIndex: 0, col: 1, row: row } }
            }
        }
        for (; col < lasti; col++) {
            const c = line[col]
            if (c === ' ' || c === '\t' || c === ',') {
                if (!is_string && brackets.length === 0) {
                    tokenEnd()
                } else {
                    token.value += c
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

        // this.byteLines[row-1] = this.bytes.length

        let type = tokens[0]
        if (!type) return
        else if (type.value[type.value.length - 1] === ':') {
            const label = type.value.substring(0, type.value.length - 1)
            // this.byteLabels[label] = this.bytes.length
            this.labels[label] = { ...type.addr, codeIndex: this.bytes.length }
            tokens.shift()
        }

        type = tokens[0]
        if (!type) return
        else if (type.value[0] === '.') {
            if (type.value === '.string') {
                for (const token of tokens.slice(1)) {
                    const s = JSON.parse(token.value)
                    if (typeof s !== 'string') throw new InvalidDataError(token)
                    // console.log(token.value)
                    this.bytes.push(...strToBytes(s))
                }
            } else if (type.value === '.global') {
                this.globalTokens[tokens[1].value] = tokens[1]
            } else if (type.value === '.balign') {
                const num = parseInt(tokens[1].value)
                if ((Math.log(num)/Math.log(2)) % 1 !== 0) throw new AsmSyntaxError(`num_bytes should be power of 2`, tokens[1])
                while(this.bytes.length % num > 0) {
                    this.bytes.push(0)
                }
            }
        } else {
            const inst = parseInst(tokens, this.bytes.length)
            this.bytes.push(inst, null, null, null)
        }
    }

    compileAll() {
        this.lines = this.text.split('\n')
        this.macros = getMacros(this)
        this.bytes = []
        // this.byteLines = this.lines.map(() => 0)
        this.lines
            .map(l => l.split("//")[0].trimEnd())
            .map((line, i) => this.compileLine(line, i + 1))

        // Check global labels are present
        for (const label in this.globalTokens) {
            const addr = this.labels[label]
            if (!addr) throw new LabelNotFoundError(this.globalTokens[label])
            // this.globalLabels[label] = addr
        }

        // console.log(this.bytes)
        // const m = this.macros['read_r']
        // console.log(JSON.stringify(this.text.substring(m.defStart.i, m.defEnd.i)))
    }

}