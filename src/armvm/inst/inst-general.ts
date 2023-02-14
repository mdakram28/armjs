import ArmVM from "../armvm";
import { BadJumpError, LabelNotFoundError } from "../errors";
import { STD_LIB } from "../libc";
import { LibFunc } from "../types";
import { INST, Inst } from "./inst";

INST.mov = class Inst_mov extends Inst {
    run(vm: ArmVM): void {
        let val = this.readImmOrReg(this.tokens[2], vm);
        vm.state.set(this.tokens[1], val)
    }
}

INST.b = class Inst_b extends Inst {
    run(vm: ArmVM): boolean {
        if (!this.checkCondition(vm)) return false
        let label = this.tokens[1].value
        const addr = vm.findLabelAddr(label, this.tokens[1])
        if (addr) {
            vm.state.setPC(vm.nextNonNullInstAddr(vm.toRamAddr(addr)))
            return true
        } else if (label in STD_LIB) {
            throw new BadJumpError(label, this.tokens[1])
        } else {
            throw new LabelNotFoundError(this.tokens[1])
        }
    }
}

INST.bl = class Inst_bl extends Inst {
    run(vm: ArmVM): boolean {
        let label = this.tokens[1].value
        const addr = vm.findLabelAddr(label, this.tokens[1])
        if (vm.state.ram[vm.toRamAddr(addr)] instanceof Function) {
            // Library function, Execute immediately
            (vm.state.ram[vm.toRamAddr(addr)] as LibFunc)(vm)
            return false
        } else if (addr) {
            vm.state.setPC(vm.nextNonNullInstAddr(vm.toRamAddr(addr)))
            return true
        } else {
            throw new LabelNotFoundError(this.tokens[1])
        }
    }
}

INST.add = class Inst_add extends Inst {
    run(vm: ArmVM): void {
        let val = vm.state.get(this.tokens[2].value, this.tokens[2])
        val += this.readImmOrReg(this.tokens[3], vm);
        vm.state.set(this.tokens[1], val)
    }
}

INST.cmp = class Inst_cmp extends Inst {
    run(vm: ArmVM): void {
        const r1 = (this.tokens[1].value).toLowerCase()
        const regSize = r1[0] === 'x' ? 64 : 32
        const regMask = r1[0] === 'x' ? 0xFFFFFFFFFFFFFFFF : 0xFFFFFFFF
        let val1 = vm.state.get(r1, this.tokens[1])
        let val2 = this.readImmOrReg(this.tokens[2], vm)

        const res = val1 - val2

        vm.state.flags = {
            n: res<0,
            z: res===0,
            c: Boolean((val1-val2) >> regSize),
            v: Boolean((val1-val2) >> regSize),
        }
        console.log(val1, val2, vm.state.flags)
    }
}