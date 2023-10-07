use super::ArmInst;
use crate::{
    bit_vars, bitmask, get_gpr_sp, logfmt, set_gpr_sp, sign_type, util::log,
    util_bits::sign_extend64, ArmV8State, TODO_INST,
};

type Doer = Box<dyn FnMut(&mut ArmV8State) -> ()>;

pub struct ArmInstBranch {
    inner_run: Doer,
}
impl ArmInst for ArmInstBranch {
    fn run(&mut self, state: &mut ArmV8State) {
        (*self.inner_run)(state);
    }
}

#[allow(non_snake_case)]
impl ArmInstBranch {
    pub fn new(inst: u32) -> Box<ArmInstBranch> {
        logfmt!("Unconditional branch (immediate)");

        bit_vars!(inst, op = [31, 1], imm26 = [25, 26]);

        let offset = sign_extend64(imm26 << 2, 28);

        if op == 1 {
            // BL
            return Box::new(ArmInstBranch {
                inner_run: Box::new(move |state: &mut ArmV8State| {
                    state.gpr[30] = state.spr_pc + 4;
                    logfmt!("Branching from {} by offset {}", state.spr_pc as i64, offset);
                    state.spr_pc = (state.spr_pc as i64 + offset) as u64;
                    logfmt!("BL {}", state.spr_pc);
                }),
            });
        } else {
            // B
            return Box::new(ArmInstBranch {
                inner_run: Box::new(move |state: &mut ArmV8State| {
                    state.spr_pc = (state.spr_pc as i64 + offset) as u64;
                }),
            });
        }
    }
}
