pub mod inst_macros {
    
    #[macro_export]
    macro_rules! get_gpr_sp {
        ($state: ident, $reg: ident) => {
            match $reg {
                0b11111 => $state.spr[0],
                _ => $state.gpr[$reg as usize],
            }
        };
    }
    #[macro_export]
    macro_rules! set_gpr_sp {
        ($state: ident, $reg: ident, $val:expr) => {
            match $reg {
                0b11111 => $state.spr[0] = $val,
                _ => $state.gpr[$reg as usize] = $val,
            };
        };
    }
}
