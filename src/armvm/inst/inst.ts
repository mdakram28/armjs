import ArmVM from "../armvm";
import { UnknownInstructionError } from "../errors";
import { CodeAddr, Token } from "../types";

export const INST: Record<string, typeof Inst> = {}

export function parseInst(tokens: Token[], codeIndex: number): Inst {
    // console.log(tokens)
    const type = tokens[0].value.toLowerCase().split('.')
    if(type.length > 2) throw new UnknownInstructionError(tokens[0])
    
    let inst_cl: (typeof Inst | null) = INST[type[0]]
    if (!inst_cl) throw new UnknownInstructionError(tokens[0])

    const inst = new (inst_cl as any)(tokens, codeIndex)

    return inst
}

export abstract class Inst {
    type: string
    condition: string
    tokens: Token[]
    addr: CodeAddr

    constructor(tokens: Token[], codeIndex: number) {
        this.type = tokens[0].value.split('.')[0]
        this.tokens = tokens
        this.addr = {...tokens[0].addr, codeIndex}
        this.condition = tokens[0].value.split('.')[1]
    }

    readImmOrReg(token: Token, vm: ArmVM): number {
        if (!isNaN(token.value as any)) {
            return parseInt(token.value)
        } else {
            return vm.state.get(token.value, token)
        }
    }

    // TODO: More Condition Codes
    checkCondition(vm: ArmVM): boolean {
        if (!this.condition) return true
        if (this.condition === 'lt') {
            return vm.state.flags.n
        } else {
            throw new UnknownInstructionError(this.tokens[0])
        }
    }

    abstract run(vm: ArmVM): void;
}