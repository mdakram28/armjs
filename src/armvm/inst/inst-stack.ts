import ArmVM from "../armvm";
import { INST, Inst } from "./inst";

INST.ret = class Inst_ret extends Inst {
    run(vm: ArmVM): void {
        throw new Error("Method not implemented.");
    }
}