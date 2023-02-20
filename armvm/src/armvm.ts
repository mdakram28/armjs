import AsmCode from "./code";
import { DuplicateLabelError, EndOfCodeError, InvalidRegisterError, LabelNotFoundError } from "./errors";
import { Inst } from "./inst/inst";
import { IOStream } from "./iostream";
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
            // console.log(`Updated value of GPR: ${name} -> ${val}`)
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
            if (name === 'pc') throw new Error('Cannot set PC using register set.')
            return (this.spr as any)[name]
        } else {
            throw new InvalidRegisterError(token)
        }
    }
}

export class ArmVM {
    codes: Record<string, AsmCode>
    codeOffsets: Record<string, number>
    _state: VmState
    // state: ArmV8State
    globalLabels: Record<string, CodeAddr>

    FD: Record<number, IOStream>
    nextFDNum: number

    constructor() {
        this.codes = {}
        this.codeOffsets = {}
        // this.state = ArmV8State.new()
        this._state = new VmState()
        this.globalLabels = {}
        this.FD = {}
        this.nextFDNum = 0
        this.loadLib('libc.ts', STD_LIB)
        this.loadFD(new IOStream()) // STDIN_FILENO
        this.loadFD(new IOStream()) // STDOUT_FILENO
        this.loadFD(new IOStream()) // STDERR_FILENO
    }

    gotoMain() {
        let mainAddr = this.globalLabels.main;
        if (!mainAddr) {
            throw new LabelNotFoundError({ value: 'main', addr: Object.values(this.codes)[0].toAddr(0) })
        }
        const nextAddr = this.nextNonNullInstAddr(this.toRamAddr(mainAddr))
        this._state.setPC(nextAddr)
        // console.log(mainAddr, nextAddr)

        // this.state.inst_load(0xd280021d)
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
        
        while (ramAddr < this._state.ram.length && (this._state.ram[ramAddr] === null || !(this._state.ram[ramAddr] instanceof Inst))) {
            ramAddr++
        }
        
        if (ramAddr >= this._state.ram.length) {
            console.log("End of Code.")
        }
        
        return ramAddr
    }

    runLine() {
        const ramAddr = this._state.spr.pc
        if (ramAddr >= this._state.ram.length) {
            throw new EndOfCodeError()
        }
        // console.log(ramAddr)
        const inst = this._state.ram[Number(ramAddr)] as Inst
        // console.log("Running Instruction", inst)
        const isJump = Boolean(inst!.run(this))

        if (!isJump)
            this._state.setPC(this.nextNonNullInstAddr(Number(ramAddr) + 1))
    }

    load(name: string, text: string) {
        const code = new AsmCode(name, text)
        this.codes[name] = code
        code.compileAll()

        // Load Code in RAM
        this.codeOffsets[name] = this._state.ram.length
        this._state.ram.push(...code.bytes)

        // Load code globals
        for (const label in code.globalTokens) {
            if (this.globalLabels[label]) throw new DuplicateLabelError(this.globalLabels[label].codeName, code.globalTokens[label])
            this.globalLabels[label] = code.labels[label]
        }

        // console.log(name, code.globalLabels)
    }

    loadLib(name: string, lib: Library) {
        this.codeOffsets[name] = this._state.ram.length

        let codeIndex = 0
        for (const label in lib) {
            this.globalLabels[label] = { codeName: name, col: 0, row: 0, textIndex: 0, codeIndex: codeIndex }
            this._state.ram.push(lib[label])
            codeIndex++
        }
    }

    loadFD(stream: IOStream) {
        this.FD[this.nextFDNum++] = stream
    }

}