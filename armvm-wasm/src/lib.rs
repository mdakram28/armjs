use crate::insts::{
    inst_data_proc::{ArmInstLogicalShifted, ArmInstMov,ArmInstAddSub, ArmInstPcRel},
    inst_load_store::ArmInstLoadStore,
    ArmInst, ArmInstNop,
};
use std::primitive;
use crate::util::*;
use core::panic;
use std::collections::HashMap;
use js_sys::Float64Array;
use page_table::PageTable;
use wasm_bindgen::prelude::*;
mod insts;
mod util;
mod util_bits;
mod util_inst;
mod page_table;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct ArmV8State {
    ram_offset: usize,
    ram: PageTable,

    // Mutable registers
    gpr: Vec<u64>,
    spr: Vec<u64>,

    // Immutable Registers
    spr_pc: u64,
    spr_nzcv: u64,

    // Index of gpr and spr by name
    gpr_by_name: HashMap<String, usize>,
    spr_by_name: HashMap<String, usize>,
}

#[allow(unused, non_snake_case)]
impl ArmV8State {
    pub fn new() -> ArmV8State {
        console_error_panic_hook::set_once();
        let mut ret = ArmV8State {
            ram: PageTable::new(),
            ram_offset: 0,
            // insts: Vec::new(),
            gpr: vec![0; 32],
            spr: vec![0; 5],
            spr_pc: 0,
            spr_nzcv: 0,
            gpr_by_name: HashMap::new(),
            spr_by_name: HashMap::new(),
        };
        ret.reset();
        ret
    }

    pub fn reset(&mut self) {
        log("Reseting ArmV8State");
        self.gpr_by_name.clear();
        self.spr_by_name.clear();

        for i in 0..32 {
            self.gpr[i] = 0;
            self.gpr_by_name.insert(format!("x{}", i), i);
        }

        for i in 0..100 {
            self.ram[i] = 0;
        }
        self.spr[0] = 0;
        self.spr_by_name.insert("sp".to_string(), 0);

        self.spr_pc = 0;
        self.spr_nzcv = 0;
    }

    pub fn ram_load(&mut self, buffer: Vec<f64>, mut offset: usize) {
        // self.ram.resize(offset, 0);
        for i in buffer {
            self.ram[offset] = i as u8;
            offset += 1;
        }
    }

    fn increment_PC(&mut self) {
        self.spr_pc += 4;
    }

    // pub fn get_reg_val(&self, name: &str) -> u64 {
    //     match self.gpr_by_name.get(name) {
    //         Some(i) => self.gpr[*i],
    //         None => match self.spr_by_name.get(name) {
    //             Some(i) => self.spr[*i],
    //             None => panic!("Cannot get svalue, Register not found"),
    //         },
    //     }
    // }

    // pub fn set_reg_val(&mut self, name: &str, val: u64) {
    //     match self.gpr_by_name.get(name) {
    //         Some(i) => self.gpr[*i] = val,
    //         None => match self.spr_by_name.get(name) {
    //             Some(i) => self.spr[*i] = val,
    //             None => panic!("Cannot set value, Register not found"),
    //         },
    //     }
    // }

    // pub fn copy_reg(&mut self, dest: &str, source: &str) {
    //     self.set_reg_val(dest, self.get_reg_val(source))
    // }
}

#[wasm_bindgen]
pub struct ArmV8Core {
    state: ArmV8State,
    insts: Vec<Box<dyn ArmInst>>,
}

#[wasm_bindgen]
impl ArmV8Core {
    pub fn new() -> ArmV8Core {
        ArmV8Core {
            state: ArmV8State::new(),
            insts: Vec::new(),
        }
    }

    pub fn inst_run(&mut self, max_count: i32) {
        let mut count: i32 = 0;
        let len = self.insts.len() as u64 - 1;
        while count != max_count {
            // let inst_i = &self.state.spr_pc/4 + 1;
            // logfmt!("+ Running inst: {inst_i}/{len}");
            let inst_b = &mut self.insts[(self.state.spr_pc / 4) as usize];
            inst_b.as_mut().run(&mut self.state);
            self.state.increment_PC();
            count += 1;
            if self.state.spr_pc > len * 4 {
                self.state.spr_pc = 0;
            }
        }
    }

    pub fn ram_load(&mut self, buffer: Float64Array, offset: u64) {
        self.state.ram_load(buffer.to_vec(), offset as usize);
    }

    pub fn inst_load(&mut self, inst: u32) {
        log("---------------------------------------- Loading");
        let inst = self.inst_top_level(inst);
        self.insts.push(inst);
        log("---------------------------------------- Loaded");
    }

    fn inst_top_level(&mut self, inst: u32) -> Box<dyn ArmInst> {
        let op = (inst >> 25) & 0b1111;
        let op_1 = (inst >> 24) & 0xFF;
        let op_2 = (inst >> 16) & 0xFF;
        let op_3 = (inst >> 8) & 0xFF;
        let op_4 = (inst >> 0) & 0xFF;
        log(format!("Instruction: {op_1:08b} {op_2:08b} {op_3:08b} {op_4:08b}").as_str());
        log(format!("op={op:04b}").as_str());
        match op {
            0b0000 => TODO_INST("Reserved"),
            0b0001 => TODO_INST("Unallocated"),
            0b0010 => TODO_INST("SVE Encodings"),
            0b0011 => TODO_INST("Unallocated"),
            0b0100 => return self.inst_load_store(inst),
            0b0101 => return self.inst_data_processing_register(inst),
            0b0110 => return self.inst_load_store(inst),
            0b0111 => TODO_INST("Data Processing -- Scalar Floating-Point and Advanced SIMD"),
            0b1000 => return self.inst_data_processing_immediate(inst),
            0b1001 => return self.inst_data_processing_immediate(inst),
            0b1010 => return self.inst_branches_exception_generating_system(inst),
            0b1011 => return self.inst_branches_exception_generating_system(inst),
            0b1100 => return self.inst_load_store(inst),
            0b1101 => return self.inst_data_processing_register(inst),
            0b1110 => return self.inst_load_store(inst),
            0b1111 => TODO_INST("Data Processing -- Scalar Floating-Point and Advanced SIMD"),
            _ => panic!("UNKNOWN"),
        };
        panic!()
    }

    fn inst_data_processing_immediate(&mut self, inst: u32) -> Box<dyn ArmInst> {
        log("Data Processing -- Immediate");
        let op0 = (inst >> 23) & 0b111;
        // log(format!("op0={op0:03b}").as_str());
        match op0 {
            0b000 => return ArmInstPcRel::new(inst),
            0b001 => TODO_INST("PC-rel. addressing"),
            0b010 => return ArmInstAddSub::new(inst),
            0b011 => TODO_INST("Add/subtract (immediate, with tags)"),
            0b100 => TODO_INST("Logical (immediate)"),
            0b101 => return ArmInstMov::new(inst),
            0b110 => TODO_INST("Bitfield"),
            0b111 => TODO_INST("Extract"),
            _ => panic!("UNKNOWN"),
        };
        panic!()
    }

    fn inst_data_processing_register(&mut self, inst: u32) -> Box<dyn ArmInst> {
        log("Data Processing -- Register");
        let op0 = (inst >> 30) & 0b1;
        let op1 = (inst >> 28) & 0b1;
        let op2 = (inst >> 21) & 0b1111;
        let op3 = (inst >> 10) & 0b111111;
        log(format!("op0={op0:01b}, op1={op1:01b}, op2={op2:04b}, op3={op3:06b}, ").as_str());
        if op0 == 0 && op1 == 1 && op2 == 0b0110 {
            TODO_INST("Data-processing (2 source)");
        } else if op0 == 1 && op1 == 1 && op2 == 0b0110 {
            TODO_INST("Data-processing (1 source)");
        } else if op1 == 0 {
            if (op2 & 0b1000) == 0 {
                return ArmInstLogicalShifted::new(inst);
            } else if (op2 & 0b1001) == 0b1000 {
                TODO_INST("Add/subtract (shifted register)");
            } else if (op2 & 0b1001) == 0b1001 {
                TODO_INST("Add/subtract (extended register)");
            } else {
                TODO_INST("UNKNOWN");
            }
        } else {
            if op2 == 0 {
                if op3 == 0 {
                    TODO_INST("Add/subtract (with carry)")
                } else if (op3 & 0b011111) == 0b000001 {
                    TODO_INST("Rotate right into flags")
                } else if (op3 & 0b001111) == 0b000010 {
                    TODO_INST("Evaluate into flags")
                }
            } else if op2 == 0b0010 {
                if (op3 & 0b000010) == 0b000000 {
                    TODO_INST("Conditional compare (register)")
                } else if (op3 & 0b000010) == 0b000000 {
                    TODO_INST("Conditional compare (immediate)")
                }
            } else if op2 == 0b0100 {
                TODO_INST("Conditional select")
            } else if (op2 & 0b1000) == 0b1000 {
                TODO_INST("Data-processing (3 source)")
            }
            TODO_INST("")
        }
        panic!();
    }

    fn inst_branches_exception_generating_system(&mut self, inst: u32) -> Box<dyn ArmInst> {
        log("Branches, Exception Generating and System instructions");
        let op0 = (inst >> 29) & 0b111;
        let op1 = (inst >> 12) & 0b11111111111111;
        let op2 = (inst >> 0) & 0b11111;

        log(format!("op0={op0:03b}, op1={op1:014b}, op2={op2:05b}, ").as_str());
        match op0 {
            0b000 => TODO_INST("Unconditional branch (immediate)"),
            0b001 => TODO_INST("Compare and branch (immediate)"),
            0b010 => TODO_INST("Conditional branch (immediate)"),
            0b011 => TODO_INST("UNKNOWN"),
            0b100 => TODO_INST("Unconditional branch (immediate)"),
            0b101 => TODO_INST("Compare and branch (immediate)"),
            0b110 => {
                if op1 == 0b01000000110010 {
                    log("NOP Instruction");
                    return ArmInstNop::new();
                } else {
                    TODO_INST("Unknown");
                }
            }
            0b111 => TODO_INST("UNKNOWN"),
            _ => panic!("UNKNOWN"),
        };
        panic!()
    }

    fn inst_load_store(&mut self, inst: u32) -> Box<dyn ArmInst> {
        bit_vars!(
            inst,
            op0 = [31, 4],
            op1 = [26, 1],
            op2 = [24, 2],
            op3 = [21, 6],
            op4 = [11, 2]
        );

        if inst & 0b10110101101000000000000000000000 == 0b00000000001000000000000000000000 {
            TODO_INST("Compare and swap pair")
        } else if inst & 0b10110101101111110000000000000000 == 0b00000100000000000000000000000000 {
            TODO_INST("Advanced SIMD load/store multiple structures")
        } else if inst & 0b10110101101000000000000000000000 == 0b00000100100000000000000000000000 {
            TODO_INST("Advanced SIMD load/store multiple structures (post-indexed)")
        } else if inst & 0b10110101001000000000000000000000 == 0b00000100001000000000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b10110101100111110000000000000000 == 0b00000101000000000000000000000000 {
            TODO_INST("Advanced SIMD load/store single structure")
        } else if inst & 0b10110101100000000000000000000000 == 0b00000101100000000000000000000000 {
            TODO_INST("Advanced SIMD load/store single structure (post-indexed)")
        } else if inst & 0b10110100100100000000000000000000 == 0b00000100000100000000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b10110100100010000000000000000000 == 0b00000100000010000000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b10110100100001000000000000000000 == 0b00000100000001000000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b10110100100000100000000000000000 == 0b00000100000000100000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b10110100100000010000000000000000 == 0b00000100000000010000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b11110101001000000000000000000000 == 0b11010001001000000000000000000000 {
            TODO_INST("Load/store memory tags")
        } else if inst & 0b10110101101000000000000000000000 == 0b10000000001000000000000000000000 {
            TODO_INST("Load/store exclusive pair")
        } else if inst & 0b10110100000000000000000000000000 == 0b10000100000000000000000000000000 {
            TODO_INST("UNALLOCATED")
        } else if inst & 0b00110101101000000000000000000000 == 0b00000000000000000000000000000000 {
            TODO_INST("Load/store exclusive register")
        } else if inst & 0b00110101101000000000000000000000 == 0b00000000100000000000000000000000 {
            TODO_INST("Load/store ordered")
        } else if inst & 0b00110101101000000000000000000000 == 0b00000000101000000000000000000000 {
            TODO_INST("Compare and swap")
        } else if inst & 0b00110101001000000000110000000000 == 0b00010001000000000000000000000000 {
            TODO_INST("LDAPR/STLR (unscaled immediate)")
        } else if inst & 0b00110001000000000000000000000000 == 0b00010000000000000000000000000000 {
            TODO_INST("Load register (literal)")
        } else if inst & 0b00110001001000000000110000000000 == 0b00010001000000000000010000000000 {
            TODO_INST("Memory Copy and Memory Set")
        } else if inst & 0b00110001100000000000000000000000 == 0b00100000000000000000000000000000 {
            TODO_INST("Load/store no-allocate pair (offset)")
        } else if inst & 0b00110001100000000000000000000000 == 0b00100000100000000000000000000000 {
            TODO_INST("Load/store register pair (post-indexed)")
        } else if inst & 0b00110001100000000000000000000000 == 0b00100001000000000000000000000000 {
            TODO_INST("Load/store register pair (offset)")
        } else if inst & 0b00110001100000000000000000000000 == 0b00100001100000000000000000000000 {
            TODO_INST("Load/store register pair (pre-indexed)")
        } else if inst & 0b00110001001000000000110000000000 == 0b00110000000000000000000000000000 {
            TODO_INST("Load/store register (unscaled immediate)")
        } else if inst & 0b00110001001000000000110000000000 == 0b00110000000000000000010000000000 {
            TODO_INST("Load/store register (immediate post-indexed)")
        } else if inst & 0b00110001001000000000110000000000 == 0b00110000000000000000100000000000 {
            TODO_INST("Load/store register (unprivileged)")
        } else if inst & 0b00110001001000000000110000000000 == 0b00110000000000000000110000000000 {
            TODO_INST("Load/store register (immediate pre-indexed)")
        } else if inst & 0b00110001001000000000110000000000 == 0b00110000001000000000000000000000 {
            TODO_INST("Atomic memory operations")
        } else if inst & 0b00110001001000000000110000000000 == 0b00110000001000000000100000000000 {
            TODO_INST("Load/store register (register offset)")
        } else if inst & 0b00110001001000000000010000000000 == 0b00110000001000000000010000000000 {
            TODO_INST("Load/store register (pac)")
        } else if inst & 0b00110001000000000000000000000000 == 0b00110001000000000000000000000000 {
            return ArmInstLoadStore::new(inst);
            // TODO_INST("Load/store register (unsigned immediate)")
        }

        // parse_inst_map!(" \
        // 0x00	0	00	1xxxxx	xx	Compare and swap pair \
        // 0x00	1	00	000000	xx	Advanced SIMD load/store multiple structures \
        // 0x00	1	01	0xxxxx	xx	Advanced SIMD load/store multiple structures (post-indexed) \
        // 0x00	1	0x	1xxxxx	xx	UNALLOCATED \
        // 0x00	1	10	x00000	xx	Advanced SIMD load/store single structure \
        // 0x00	1	11	xxxxxx	xx  Advanced SIMD load/store single structure (post-indexed) \
        // 0x00	1	x0	x1xxxx	xx	UNALLOCATED \
        // 0x00	1	x0	xx1xxx	xx	UNALLOCATED \
        // 0x00	1	x0	xxx1xx	xx	UNALLOCATED \
        // 0x00	1	x0	xxxx1x	xx	UNALLOCATED \
        // 0x00	1	x0	xxxxx1	xx	UNALLOCATED \
        // 1101	0	1x	1xxxxx	xx	Load/store memory tags \
        // 1x00	0	00	1xxxxx	xx	Load/store exclusive pair \
        // 1x00	1	xx	xxxxxx	xx  UNALLOCATED \
        // xx00	0	00	0xxxxx	xx	Load/store exclusive register \
        // xx00	0	01	0xxxxx	xx	Load/store ordered \
        // xx00	0	01	1xxxxx	xx	Compare and swap \
        // xx01	0	1x	0xxxxx	00	LDAPR/STLR (unscaled immediate) \
        // xx01	x	0x	xxxxxx	xx  Load register (literal) \
        // xx01	x	1x	0xxxxx	01	Memory Copy and Memory Set \
        // xx10	x	00	xxxxxx	xx  Load/store no-allocate pair (offset) \
        // xx10	x	01	xxxxxx	xx  Load/store register pair (post-indexed) \
        // xx10	x	10	xxxxxx	xx  Load/store register pair (offset) \
        // xx10	x	11	xxxxxx	xx  Load/store register pair (pre-indexed) \
        // xx11	x	0x	0xxxxx	00	Load/store register (unscaled immediate) \
        // xx11	x	0x	0xxxxx	01	Load/store register (immediate post-indexed) \
        // xx11	x	0x	0xxxxx	10	Load/store register (unprivileged) \
        // xx11	x	0x	0xxxxx	11	Load/store register (immediate pre-indexed) \
        // xx11	x	0x	1xxxxx	00	Atomic memory operations \
        // xx11	x	0x	1xxxxx	10	Load/store register (register offset) \
        // xx11	x	0x	1xxxxx	x1	Load/store register (pac) \
        // xx11	x	1x	xxxxxx	xx  Load/store register (unsigned immediate)");

        panic!();
    }
}
