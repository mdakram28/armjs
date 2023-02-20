import { ArmVM } from "../armvm"
import { BracketMismatchError } from "../errors"
import { INST, Inst } from "./inst"

INST.ldr = class Inst_ldr extends Inst {
    run(vm: ArmVM): void {
        let val = this.tokens[2].value
        if (val[0] === '=') {
            val = val.substring(1)
            if (isNaN(val as any)) {
                const addr = vm.toRamAddr(vm.findLabelAddr(val, this.tokens[2]))
                vm._state.set(this.tokens[1], addr)
            } else {
                vm._state.set(this.tokens[1], parseInt(val))
            }
        } else if (val[0] === '[') {
            if (val[val.length-1] !== ']') throw new BracketMismatchError(this.tokens[2])
        }
    }
}

