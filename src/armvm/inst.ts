import ArmVM from "./armvm";
import { BadJumpError, LabelNotFoundError, UnknownInstructionError } from "./errors";
import { STD_LIB } from "./stdlib";
import { InstArg, Token } from "./types";

export function parseInst(tokens: Token[]): (Inst | null) {
    const type = tokens[0].value.toLowerCase()
    let inst: (Inst | null) = null
    switch (type) {
        case 'mov':
            inst = new Inst_mov(tokens); break
        case 'add':
            inst = new Inst_add(tokens); break
        case 'ldr':
            inst = new Inst_ldr(tokens); break
        case 'b':
            inst = new Inst_b(tokens); break
        case 'bl':
            inst = new Inst_bl(tokens); break
        default:
            throw new UnknownInstructionError(tokens[0])
    }

    return inst
}

export abstract class Inst {
    type: string
    tokens: Token[]
    args: InstArg[]
    
    constructor(tokens: Token[]) {
        this.type = tokens[0].value
        this.tokens = tokens
        this.args = this.tokens.slice(1).map(t => {
            return (parseInt(t.value) || t.value)
        })
    }

    readImmOrReg(val: InstArg, vm: ArmVM): number {
        if (typeof val === 'string') {
            return vm.state.get(val)
        } else {
            return val
        }
    }

    abstract run(vm: ArmVM): void;
}

export class Inst_mov extends Inst {
    run(vm: ArmVM): void {
        let val = this.readImmOrReg(this.args[1], vm);
        vm.state.set(this.args[0] as string, val, this.tokens[1])
    }
}

export class Inst_ldr extends Inst {
    run(vm: ArmVM): void {
        let val = this.args[1] as string
        if (val[0] === '=') {
            val = val.substring(1)
            if (isNaN(val as any)) {
                const addr = vm.codes[this.tokens[0].addr.n].labels[val]
                if (!addr) throw new LabelNotFoundError(val, this.tokens[1])
                vm.state.set(this.args[0] as string, addr as unknown as number, this.tokens[1])
            } else {
                vm.state.set(this.args[0] as string, parseInt(val), this.tokens[1])
            }
        }
        // let val = this.readImmOrReg(this.args[1], vm);
        
    }
}

export class Inst_b extends Inst {
    run(vm: ArmVM): boolean {
        let label = this.args[0] as string
        const addr = vm.codes[this.tokens[0].addr.n].labels[label]
        // console.log(addr, vm.nextNonNullInst(addr))
        if (addr) {
            vm.state.set('pc', vm.nextNonNullInst(addr) as unknown as number)
            return true
        } else if (label in STD_LIB) {
            throw new BadJumpError(label, this.tokens[1])
        } else {
            throw new LabelNotFoundError(label, this.tokens[1])
        }
    }
}

export class Inst_bl extends Inst {
    run(vm: ArmVM): boolean {
        let label = this.args[0] as string
        const addr = vm.codes[this.tokens[0].addr.n].labels[label]
        if (addr) {
            vm.state.set('pc', vm.nextNonNullInst(addr) as unknown as number)
            return true
        } else if (label in STD_LIB) {
            STD_LIB[label](vm)
            return false
        } else {
            throw new LabelNotFoundError(label, this.tokens[1])
        }
    }
}

export class Inst_add extends Inst {
    run(vm: ArmVM): void {
        let val = vm.state.get(this.args[1] as string)
        val += this.readImmOrReg(this.args[2], vm);
        vm.state.set(this.args[0] as string, val, this.tokens[1])
    }
}