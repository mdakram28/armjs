#[macro_export]
macro_rules! bitmask {
    ($inst: ident, $msb: literal, $len: literal) => {
        ($inst >> ($msb - $len + 1)) & ((1 << $len) - 1)
    };
}

#[macro_export]
macro_rules! bit_vars {
    (
        $inst: ident
        $(, $varName:tt = [$start:literal , $len:literal])*
    ) => {
        $(
            let $varName: u32 = bitmask!($inst, $start, $len);
        )*

        log(format!(concat!(
            "bit_vars: ",
            $(
                stringify!($varName),
                "={:0",
                stringify!($len),
                "b}, ",
            )*
        ),
        $(
            $varName,
        )*
    ).as_str());
    };
}

#[macro_export]
macro_rules! sign_type {
    (u64) => {
        i64
    };
    (u32) => {
        i32
    };
    ($t: tt) => {
        i64
    };
}

#[allow(unused)]
pub fn sign_extend32(data: u32, size: u32) -> i32 {
    // assert!(size > 0 && size <= 32);
    ((data << (32 - size)) as i32) >> (32 - size)
}

pub fn sign_extend64(data: u32, size: u32) -> i64 {
    // assert!(size > 0 && size <= 32);
    ((data << (64 - size)) as i64) >> (64 - size)
}

/*
   bit_vars!(
       sf=[1]
   )
*/
