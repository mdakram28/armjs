import { CodeAddr, Token } from "./types"
import { addrToString } from "./util"

export class AsmSyntaxError extends Error {
    token: Token
    constructor(msg: string, token: Token) {
        super(msg + `: "${token.value}" on "${addrToString(token.addr)}"`)
        this.token = token
    }
}
export class AsmRuntimeError extends Error { }

export class BracketMismatchError extends AsmSyntaxError {
    constructor(token: Token) {
        super(`Bracket mismatch`, token)
        this.name = "BracketMismatchError"
    }
}

export class BracketUnclosedError extends AsmSyntaxError {
    constructor(token: Token) {
        super(`Bracket is not closed`, token)
        this.name = "BracketUnclosedError"
    }
}

export class WrongNumberOfArgs extends AsmSyntaxError {
    constructor(msg: string, token: Token) {
        super(msg, token)
        this.name = "WrongNumberOfArgs"
    }
}


export class InvalidRegisterError extends AsmSyntaxError {
    constructor(token: Token) {
        super(`Unknown register`, token)
        this.name = "InvalidRegisterError"
    }
}

export class LabelNotFoundError extends AsmSyntaxError {
    constructor(token: Token) {
        super(`Label not found`, token)
        this.name = "LabelNotFoundError"
    }
}

export class DuplicateLabelError extends AsmSyntaxError {
    constructor(code1Name: string, token: Token) {
        super(`Duplicate global. First defined in ${code1Name}`, token)
        this.name = "DuplicateLabelError"
    }
}

export class UnknownInstructionError extends AsmSyntaxError {
    constructor(token: Token) {
        super(`Unknown Instruction`, token)
        this.name = "UnknownInstructionError"
    }
}


export class InvalidDataError extends AsmSyntaxError {
    constructor(token: Token) {
        super(`Invalid Data`, token)
        this.name = "InvalidDataError"
    }
}



export class EndOfCodeError extends AsmRuntimeError {
    constructor(msg?: string) {
        super(msg)
        this.name = "EndOfCodeError"
    }
}

export class BadReadError extends AsmRuntimeError {
    constructor(val: any, addr?: CodeAddr) {
        super(`Tried to read ${val} from ${addrToString(addr)}`)
        this.name = "BadReadError"
    }
}

export class BadJumpError extends AsmRuntimeError {
    constructor(label: string, token?: Token) {
        super(`Cannot jump to ${label} at ${addrToString(token?.addr)}`)
        this.name = "BadJumpError"
    }
}