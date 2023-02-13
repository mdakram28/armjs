import { CodeAddr, Token } from "./types"
import { addrToString } from "./util"

class SyntaxError extends Error { }
class RuntimeError extends Error { }

export class BracketMismatchError extends SyntaxError {
    constructor(msg?: string) {
        super(msg)
        this.name = "BracketMismatchError"
    }
}

export class BracketUnclosedError extends SyntaxError {
    constructor(msg?: string) {
        super(msg)
        this.name = "BracketUnclosedError"
    }
}

export class WrongNumberOfArgs extends SyntaxError {
    constructor(msg?: string) {
        super(msg)
        this.name = "WrongNumberOfArgs"
    }
}


export class InvalidRegisterError extends SyntaxError {
    constructor(name: string, token?: Token) {
        super(`Unknown register: "${name}" on ${addrToString(token?.addr)}`)
        this.name = "InvalidRegisterError"
    }
}

export class LabelNotFoundError extends SyntaxError {
    constructor(label: string, token?: Token) {
        super(`Label not found: "${label}" on ${addrToString(token?.addr)} `)
        this.name = "LabelNotFoundError"
    }
}

export class UnknownInstructionError extends SyntaxError {
    constructor(token: Token) {
        super(`Unknown Instruction "${token.value}" on ${addrToString(token.addr)}`)
        this.name = "UnknownInstructionError"
    }
}


export class InvalidDataError extends SyntaxError {
    constructor(token: Token) {
        super(`Invalid Data "${token.value}" on ${addrToString(token.addr)}`)
        this.name = "InvalidDataError"
    }
}



export class EndOfCodeError extends RuntimeError {
    constructor(msg?: string) {
        super(msg)
        this.name = "EndOfCodeError"
    }
}

export class BadReadError extends RuntimeError {
    constructor(val: any, addr?: CodeAddr) {
        super(`Tried to read ${val} from ${addrToString(addr)}`)
        this.name = "BadReadError"
    }
}

export class BadJumpError extends RuntimeError {
    constructor(label: string, token?: Token) {
        super(`Cannot jump to ${label} at ${addrToString(token?.addr)}`)
        this.name = "BadJumpError"
    }
}