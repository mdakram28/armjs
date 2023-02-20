import { ArmVM } from "./armvm"
import { Inst } from "./inst/inst"

export type CodeAddr = {
    codeName: string,
    textIndex: number,
    row: number,
    col: number,
    codeIndex?: number
}

export type Token = {
    value: string,
    addr: CodeAddr
}

export type Macro = {
    replace: string,
    defStart: CodeAddr,
    defEnd: CodeAddr,
}

export type InstArg = string | number

export type LibFunc = (vm: ArmVM) => void
export type Library = Record<string, LibFunc | number>

export type RamVal = number | Inst | null | LibFunc
