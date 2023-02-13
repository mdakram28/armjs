import { CodeAddr } from "./types";

export function inverseObject(obj: Record<string, string>) {
    const retobj: Record<string, string> = {};
    for (const key in obj) {
        retobj[obj[key]] = key;
    }
    return retobj;
}

export function addrToString(addr?: CodeAddr) {
    return `${addr?.n}:${addr?.r}:${addr?.c}`
}

export function strToBytes(str: string): number[] {
    // console.log("strToBytes", str)
    let bytes = [];
    let charCode;

    for (var i = 0; i < str.length; ++i) {
        charCode = str.charCodeAt(i);
        // console.log(charCode)
        bytes.push(charCode);
    }
    bytes.push(0)
    return bytes
}

export function bytesToStr(bytes: number[]): string {
    let str = bytes.filter(Boolean).map(b => String.fromCharCode(b)).join("");
    return str
}