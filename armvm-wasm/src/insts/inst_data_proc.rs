use super::ArmInst;
use crate::{
    bit_vars, bitmask, get_gpr_sp, set_gpr_sp, sign_type, util::log, ArmV8State, TODO_INST, logfmt,
};
// use crate::;

type Doer = Box<dyn FnMut(&mut ArmV8State) -> ()>;
// type Doer = Box<u32>;

pub struct ArmInstMov {
    inner_run: Doer,
}
pub struct ArmInstLogicalShifted {
    inner_run: Doer,
}

pub struct ArmInstAddSub {
    inner_run: Doer,
}

pub struct ArmInstPcRel {
    inner_run: Doer,
}

impl ArmInst for ArmInstMov {
    fn run(&mut self, state: &mut ArmV8State) {
        (*self.inner_run)(state);
    }
}

impl ArmInst for ArmInstLogicalShifted {
    fn run(&mut self, state: &mut ArmV8State) {
        (*self.inner_run)(state);
    }
}

impl ArmInst for ArmInstAddSub {
    fn run(&mut self, state: &mut ArmV8State) {
        (*self.inner_run)(state);
    }
}

impl ArmInst for ArmInstPcRel {
    fn run(&mut self, state: &mut ArmV8State) {
        (*self.inner_run)(state);
    }
}

#[allow(non_snake_case)]
impl ArmInstMov {
    pub fn new(inst: u32) -> Box<ArmInstMov> {
        log(format!("Move wide (immediate)").as_str());
        // let sf = (inst >> 31) == 1;
        // let opc = (inst >> 29) & 0b11;
        // let hw = (inst >> 21) & 0b11;
        // let imm16 = (inst >> 5) & 0xFF;
        // let Rd = (inst & 0b11111) as usize;
        bit_vars!(inst, sf=[31, 1], opc=[30, 2], hw=[22, 2], imm16=[20, 16], Rd=[4, 5]);
        // log(format!("opc={opc:02b}, hw={hw:02b}, Rd={Rd}, imm16={imm16}").as_str());

        if opc == 1 {
            log("UNALLOCATED");
        } else if sf == 0 {
            if hw >= 2 {
                log("UNALLOCATED");
            } else {
                log("32 bit move");
                log(format!("mov    w{Rd}, {imm16:#04x}").as_str());
                return Box::new(ArmInstMov {
                    inner_run: Box::new(move |state: &mut ArmV8State| {
                        state.gpr[Rd as usize] = imm16 as u64;
                    }),
                });
            }
        } else {
            log("64 bit move");
            log(format!("mov    x{Rd}, {imm16:#04x}").as_str());
            return Box::new(ArmInstMov {
                inner_run: Box::new(move |state: &mut ArmV8State| {
                    state.gpr[Rd as usize] = imm16 as u64;
                }),
            });
        }
        panic!()
    }
}

#[allow(non_snake_case)]
impl ArmInstLogicalShifted {
    pub fn new(inst: u32) -> Box<dyn ArmInst> {
        bit_vars!(
            inst,
            sf = [31, 1],
            opc = [30, 2],
            N = [21, 1],
            imm16 = [15, 6]
        );
        bit_vars!(
            inst,
            shift = [23, 2],
            Rd = [4, 5],
            Rn = [9, 5],
            Rm = [20, 5]
        );

        macro_rules! INST_AND {
            ($op: tt) => {
                match sf {
                    0b0 => match N {
                        0b0 => INST_AND!($op, u32, ()),
                        0b1 => INST_AND!($op, u32, (!)),
                        _ => panic!(),
                    },
                    0b1 => match N {
                        0b0 => INST_AND!($op, u64, ()), //
                        0b1 => INST_AND!($op, u64, (!)),
                        _ => panic!(),
                    },
                    _ => panic!(),
                }
            };
            ($op: tt, $t: ty, ($($resMod: tt)?)) => {
                match shift {
                    0b00 => INST_AND!($op, $t, (<< imm16), ($($resMod)*)), //
                    0b01 => INST_AND!($op, $t, (>> imm16), ($($resMod)*)),
                    0b10 => INST_AND!($op, $t, (as sign_type!($t) >> imm16), ($($resMod)*)),
                    0b11 => INST_AND!($op, $t, (<< imm16), ($($resMod)*)),
                    _ => panic!()
                }
            };
            ($op: tt, $t: ty, ($($val2Mod: tt)*), ($($resMod: tt)?)) => {
                if opc == 0b11 {
                    Box::new(ArmInstLogicalShifted {
                        inner_run: Box::new(move |state: &mut ArmV8State| {
                            let val1 = state.gpr[Rn as usize] as $t;
                            let val2 = ((state.gpr[Rm as usize] as $t) $($val2Mod)*) as $t;
                            state.gpr[Rd as usize] = $($resMod)*(val1 $op val2) as u64;
                            // TODO: set nzcv flag
                        })
                    })
                } else {
                    Box::new(ArmInstLogicalShifted {
                        inner_run: Box::new(move |state: &mut ArmV8State| {
                            let val1 = state.gpr[Rn as usize] as $t;
                            let val2 = ((state.gpr[Rm as usize] as $t) $($val2Mod)*) as $t;
                            state.gpr[Rd as usize] = $($resMod)*(val1 $op val2) as u64;
                        })
                    })
                }
            }
        }

        return match opc {
            0b00 => INST_AND!(&),
            0b01 => INST_AND!(|),
            0b10 => INST_AND!(^),
            0b11 => INST_AND!(&),
            _ => panic!(),
        };
    }
}

#[allow(non_snake_case)]
impl ArmInstAddSub {
    pub fn new(inst: u32) -> Box<ArmInstAddSub> {
        bit_vars!(
            inst,
            sf = [31, 1],
            op = [30, 1],
            S = [29, 1],
            sf_op_s = [31, 3]
        );

        bit_vars!(
            inst,
            sh = [22, 1],
            imm12 = [21, 12],
            Rn = [9, 5],
            Rd = [4, 5]
        );

        let shiftedImm12 = match sf {
            1 => (imm12 as u64) << 12,
            _ => imm12 as u64,
        };

        macro_rules! INST_ADD_SUB {
            ($t:ty, $op:tt) => {
                if S == 1 {
                    TODO_INST("Flag setting instruction");
                    panic!()
                } else {
                    Box::new(ArmInstAddSub {
                        inner_run: Box::new(move |state: &mut ArmV8State| {
                            set_gpr_sp!(state, Rd, (get_gpr_sp!(state, Rn) $op shiftedImm12) as $t as u64);
                        }),
                    })
                }
            };
        }

        return match sf_op_s {
            0b000 => INST_ADD_SUB!(u32, +),
            0b001 => INST_ADD_SUB!(u32, +),
            0b010 => INST_ADD_SUB!(u32, -),
            0b011 => INST_ADD_SUB!(u32, -),
            0b100 => INST_ADD_SUB!(u64, +),
            0b101 => INST_ADD_SUB!(u64, +),
            0b110 => INST_ADD_SUB!(u64, +),
            0b111 => INST_ADD_SUB!(u64, +),
            _ => panic!(),
        };
    }
}

#[allow(non_snake_case)]
impl ArmInstPcRel {
    pub fn new(inst: u32) -> Box<ArmInstPcRel> {
        bit_vars!(
            inst,
            op = [31, 1],
            immlo = [30, 2],
            immhi = [23, 19],
            Rd = [4, 0]
        );

        let mut addr = (immhi << 2 | immlo) as i32 as u64;

        return match op {
            0 => Box::new(ArmInstPcRel {
                inner_run: Box::new(move |state: &mut ArmV8State| {
                    state.gpr[Rd as usize] = state.spr_pc + addr;
                }),
            }),
            1 => {
                addr = addr << 12;
                Box::new(ArmInstPcRel {
                inner_run: Box::new(move |state: &mut ArmV8State| {
                    state.gpr[Rd as usize] = (state.spr_pc & 0xFFFFFFFFFFFFF000) + addr ;
                    logfmt!("ADRP x{Rd}, {}", (immhi << 2 | immlo) as i32 as u64);
                    logfmt!("Stored {:#018x} in x{}", state.gpr[Rd as usize], Rd);
                }), 
            })},
            _ => panic!(),
        };
    }
}
