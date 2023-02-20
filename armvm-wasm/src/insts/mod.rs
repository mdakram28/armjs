use crate::ArmV8State;
pub mod inst_data_proc;
pub mod inst_load_store;

pub trait ArmInst {
    // fn load(&mut self, inst: u32, state: &ArmV8State);
    fn run(&mut self, state: &mut ArmV8State);
}

pub struct ArmInstNop {}

#[allow(unused)]
impl ArmInstNop {
    pub fn new() -> Box<ArmInstNop> {
        Box::new(ArmInstNop {  })
    }
}

#[allow(unused)]
impl ArmInst for ArmInstNop {
    fn run(&mut self, _: &mut ArmV8State) {}

    // fn load(&mut self, inst: u32, state: &ArmV8State) {}
}

