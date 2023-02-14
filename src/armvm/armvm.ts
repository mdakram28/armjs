import AsmCode from "./code";
import { DuplicateLabelError, EndOfCodeError, InvalidRegisterError, LabelNotFoundError } from "./errors";
import { Inst } from "./inst/inst";
import { STD_LIB } from "./libc";
import { CodeAddr, Library, RamVal, Token } from "./types";

export class VmState {
    gpr: number[]
    spr: {
        sp: bigint,
        pc: bigint
    }
    flags: {
        n: boolean,
        z: boolean,
        c: boolean,
        v: boolean
    }
    ram: RamVal[]

    constructor() {
        this.gpr = []
        this.spr = {
            'sp': 0n,
            'pc': 0n,
        }
        this.flags = { n: false, z: false, c: false, v: false }
        this.ram = []
        this.reset()
    }

    reset() {
        this.gpr = []
        for (let i = 0; i <= 30; i++) {
            this.gpr.push(0);
        }
        this.spr = {
            'sp': 0n,
            'pc': 0n,
        }
        this.flags = { n: false, z: false, c: false, v: false }
    }

    setPC(ramAddr: number) {
        this.spr.pc = BigInt.asUintN(64, BigInt(ramAddr))
    }

    set(token: Token, val: number) {
        const name = token.value.toLowerCase()
        const firstLetter = name[0]
        if (firstLetter === 'x' || firstLetter === 'w') {
            const regNum = parseInt(name.substring(1))
            if (isNaN(regNum) || regNum < 0 || regNum > 30) throw new InvalidRegisterError(token)
            this.gpr[regNum] = val
            console.log(`Updated value of GPR: ${name} -> ${val}`)
        } else if (name in this.spr) {
            (this.spr as any)[name] = val
        } else {
            throw new InvalidRegisterError(token)
        }
    }

    get(name: string, token: Token): number {
        const firstLetter = name[0].toLowerCase()
        if (firstLetter === 'x' || firstLetter === 'w') {
            const regNum = parseInt(name.substring(1))
            if (!regNum || regNum < 0 || regNum > 30) throw new InvalidRegisterError(token)
            return this.gpr[regNum]
        } else if (name in this.spr) {
            if (name === 'pc') throw new Error('Cannot set PC using register set')
            return (this.spr as any)[name]
        } else {
            throw new InvalidRegisterError(token)
        }
    }
}

export default class ArmVM {
    codes: Record<string, AsmCode>
    codeOffsets: Record<string, number>
    state: VmState
    globalLabels: Record<string, CodeAddr>

    constructor() {
        this.codes = {}
        this.codeOffsets = {}
        this.state = new VmState()
        this.globalLabels = {}
        this.loadLib('libc.ts', STD_LIB)
    }

    gotoMain() {
        this.state.reset()
        let mainAddr = this.globalLabels.main;
        if (!mainAddr) {
            throw new LabelNotFoundError({ value: 'main', addr: Object.values(this.codes)[0].toAddr(0) })
        }
        const nextAddr = this.nextNonNullInstAddr(this.toRamAddr(mainAddr))
        this.state.setPC(nextAddr)
        console.log(mainAddr, nextAddr)
    }

    findLabelAddr(label: string, token: Token): CodeAddr {
        const code = this.codes[token.addr.codeName]
        if (code.labels[label]) return code.labels[label]
        else if (this.globalLabels[label]) return this.globalLabels[label]
        throw new LabelNotFoundError(token)
    }

    toRamAddr(addr: CodeAddr): number {
        return this.codeOffsets[addr.codeName] + addr.codeIndex!
    }

    nextNonNullInstAddr(ramAddr: number): number {
        // const code = this.codes[addr.n]
        // let ramAddr = this.toRamAddr(addr)

        while (ramAddr < this.state.ram.length && (this.state.ram[ramAddr] === null || !(this.state.ram[ramAddr] instanceof Inst))) {
            ramAddr++
        }


        if (ramAddr >= this.state.ram.length) {
            console.log("End of Code.")
        }
        return ramAddr

    }

    runLine() {
        const ramAddr = this.state.spr.pc
        if (ramAddr >= this.state.ram.length) {
            throw new EndOfCodeError()
        }
        // console.log(ramAddr)
        const inst = this.state.ram[Number(ramAddr)] as Inst
        console.log("Running Instruction", inst)
        const isJump = Boolean(inst!.run(this))

        if (!isJump)
            this.state.setPC(this.nextNonNullInstAddr(Number(ramAddr) + 1))
    }

    load(name: string, text: string) {
        const code = new AsmCode(name, text)
        this.codes[name] = code
        code.compileAll()

        // Load Code in RAM
        this.codeOffsets[name] = this.state.ram.length
        this.state.ram.push(...code.bytes)

        // Load code globals
        for (const label in code.globalTokens) {
            if (this.globalLabels[label]) throw new DuplicateLabelError(this.globalLabels[label].codeName, code.globalTokens[label])
            this.globalLabels[label] = code.labels[label]
        }

        // console.log(name, code.globalLabels)
    }

    loadLib(name: string, lib: Library) {
        this.codeOffsets[name] = this.state.ram.length

        let codeIndex = 0
        for (const label in lib) {
            this.globalLabels[label] = { codeName: name, col: 0, row: 0, textIndex: 0, codeIndex: codeIndex }
            this.state.ram.push(lib[label])
            codeIndex++
        }
    }

}