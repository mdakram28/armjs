
export type CodeAddr = {
    n: string,
    i: number,
    r: number,
    c: number,
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