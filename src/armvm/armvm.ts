import AsmCode from "./code";
import { EndOfCodeError, InvalidRegisterError, LabelNotFoundError } from "./errors";
import { CodeAddr, Token } from "./types";

export class VmState {
    gpr: number[]
    spr: {
        sp: number,
        pc: (CodeAddr | null)
    }

    constructor() {
        this.gpr = []
        this.spr = {
            'sp': 0,
            'pc': null
        }
        this.reset()
    }

    reset() {
        this.gpr = []
        for (let i = 0; i <= 30; i++) {
            this.gpr.push(0);
        }
    }

    set(name: string, val: number, token?: Token) {
        name = name.toLowerCase()
        const firstLetter = name[0]
        if (firstLetter === 'x' || firstLetter === 'w') {
            const regNum = parseInt(name.substring(1))
            if (isNaN(regNum) || regNum < 0 || regNum > 30) throw new InvalidRegisterError(name, token)
            this.gpr[regNum] = val
            console.log(`Updated value of GPR: ${name} -> ${JSON.stringify(val)}`)
        } else if (name in this.spr) {
            (this.spr as any)[name] = val
            // console.log(`Updated value of SPR: ${name} -> ${JSON.stringify(val)}`)
        }
    }

    get(name: string, token?: Token): number {
        const firstLetter = name[0].toLowerCase()
        if (firstLetter === 'x' || firstLetter === 'w') {
            const regNum = parseInt(name.substring(1))
            if (!regNum || regNum < 0 || regNum > 30) throw new InvalidRegisterError(name, token)
            return this.gpr[regNum]
        } else {
            throw new InvalidRegisterError(name, token)
        }
    }
}

export default class ArmVM {
    codes: Record<string, AsmCode>
    state: VmState

    constructor() {
        this.codes = {}
        this.state = new VmState()
    }

    gotoMain() {
        this.state.reset()
        let mainAddr = undefined;
        for(const codeName in this.codes) {
            if (this.codes[codeName].labels['main']) {
                mainAddr = this.codes[codeName].labels['main']
                break
            }
        }
        if (!mainAddr) {
            throw new LabelNotFoundError('main')
        }
        const nextAddr = this.nextNonNullInst(mainAddr)
        this.state.set('pc', nextAddr as any)
        // console.log(mainAddr, nextAddr, this.state.spr.pc)
    }

    nextNonNullInst(addr: CodeAddr): (CodeAddr | null) {
        const code = this.codes[addr.n]
        let linez = addr.r-1
        while(linez < code.inst.length && code.inst[linez] === null) {
            // console.log("Skipping null instruction on line ", linez)
            linez++
        }
        
        if (code.inst[linez] == null) {
            console.log("End of Code.")
            return null
        } else {
            return {...code.inst[linez]!.tokens[0].addr}
        }
    }

    runLine() {
        const addr = this.state.spr.pc
        if (addr === null) {
            throw new EndOfCodeError()
        }

        const inst = this.codes[addr.n].inst[addr.r-1]
        console.log("Running Instruction", inst)
        const isJump = Boolean(inst!.run(this))

        if (!isJump)
            this.state.set('pc', this.nextNonNullInst({...addr, r: addr.r+1}) as any)
    }

    load(name: string, text: string) {
        this.codes[name] = new AsmCode(name, text)
        this.codes[name].compileAll()
    }

}