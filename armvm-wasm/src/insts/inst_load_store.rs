use super::ArmInst;
use crate::{
    bit_vars, bitmask, sign_type, set_gpr_sp, get_gpr_sp, logfmt,
    util::{log, TODO_INST},
    util_bits::sign_extend64,
    ArmV8State,
};

type Doer = Box<dyn FnMut(&mut ArmV8State) -> ()>;

pub struct ArmInstLoadStore {
    inner_run: Doer,
}

#[allow(non_snake_case)]
impl ArmInstLoadStore {
    pub fn new(inst: u32) -> Box<ArmInstLoadStore> {
        bit_vars!(
            inst,
            size = [31, 2],
            V = [26, 1],
            opc = [23, 2],
            imm12 = [21, 12]
        );

        bit_vars!(
            inst,
            imm9 = [20, 9],
            Rn = [9, 5],
            Rt = [4, 5],
            preIndex = [11, 1],
            unsignedOffset = [24, 1]
        );
        let imm9_signed = sign_extend64(imm9, 9);

        // For unsigned immediates
        bit_vars!(inst, imm12 = [21, 12]);

        let imm12Shifted = imm12 << size;
        

        macro_rules! INST_STR {
            ($t: ty, $b: literal) => {{
                if unsignedOffset == 1 {
                    INST_STR!($t, $b, imm12 as i64, 0)
                } else if (preIndex == 1) {
                    INST_STR!($t, $b, imm9_signed, 0)
                } else {
                    INST_STR!($t, $b, 0, imm9_signed)
                }
            }};
            ($t: ty, $b: literal, $addrOffset: expr, $regOffset: expr) => {
                Box::new(ArmInstLoadStore {
                    inner_run: Box::new(move |state: &mut ArmV8State| {
                        let mut addr = (get_gpr_sp!(state, Rn) as i64 + $addrOffset) as usize;
                        set_gpr_sp!(state, Rn, (addr as sign_type!($t) + $regOffset) as $t as u64);
                        let mut val = state.gpr[Rt as usize];
                        state.ram[addr - state.ram_offset] = val as u8;
                        for _ in 1..$b {
                            val >>= 8;
                            addr += 1;
                            state.ram[addr - state.ram_offset] = val as u8;
                        }
                    }),
                })
            };
        }

        macro_rules! INST_LDR {
            ($t: ty, $b: literal) => {{
                if unsignedOffset == 1 {
                    INST_LDR!($t, $b, imm12Shifted as i64, 0)
                } else if (preIndex == 1) {
                    INST_LDR!($t, $b, imm9_signed, 0)
                } else {
                    INST_LDR!($t, $b, 0, imm9_signed)
                }
            }};
            ($t: ty, $b: literal, $addrOffset: expr, $regOffset: expr) => {
                Box::new(ArmInstLoadStore {
                    inner_run: Box::new(move |state: &mut ArmV8State| {
                        let mut addr = (get_gpr_sp!(state, Rn) as i64 + $addrOffset) as usize;
                        set_gpr_sp!(state, Rn, (addr as sign_type!($t) + $regOffset) as $t as u64);
                        logfmt!("addr={addr}, offset={}", $addrOffset);
                        let mut val = state.ram[addr - state.ram_offset] as u64;
                        for _ in 1..$b {
                            val <<= 8;
                            addr += 1;
                            val |= state.ram[addr - state.ram_offset] as u64;
                        }
                        // logfmt!("val={val:064b}");
                        state.gpr[Rt as usize] = val as $t as u64;
                    }),
                })
            };
        }

        if V == 1 {
            TODO_INST("SIMD&FP registers not supported")
        }

        let ret = match size {
            0b00 => match opc {
                0b00 => INST_STR!(u32, 1),
                0b01 => INST_LDR!(u32, 1),
                _ => panic!(),
            },
            0b11 => match opc {
                0b00 => INST_STR!(u64, 8),
                0b01 => INST_LDR!(u64, 8),
                _ => panic!(),
            },
            _ => panic!(),
        };
        return ret;
    }
}

impl ArmInst for ArmInstLoadStore {
    fn run(&mut self, state: &mut ArmV8State) {
        (*self.inner_run)(state);
    }
}
