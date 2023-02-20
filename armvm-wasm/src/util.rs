use wasm_bindgen::prelude::*;

use crate::ArmV8Core;

#[macro_export]
macro_rules! logfmt {
    ($($arg:tt)*) => {
        log(format!($($arg)*).as_str());
    };
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_u32(a: u32);

    #[wasm_bindgen(js_namespace = console, js_name = error)]
    pub fn log_err(s: &str);
}

#[wasm_bindgen]
pub struct JsState {
    gpr: Vec<u64>,
    spr: Vec<u64>,
}

#[wasm_bindgen]
impl JsState {
    #[wasm_bindgen(getter)]
    pub fn gpr(&self) -> js_sys::BigUint64Array {
        return js_sys::BigUint64Array::from(&self.gpr[..]);
    }

    #[wasm_bindgen(getter)]
    pub fn spr(&self) -> js_sys::BigUint64Array {
        return js_sys::BigUint64Array::from(&self.spr[..]);
    }
}

#[wasm_bindgen]
impl ArmV8Core {
    pub fn get_state(&self) -> JsState {
        return JsState {
            gpr: self.state.gpr.to_vec(),
            spr: self.state.spr.to_vec(),
        };
    }
}

#[allow(non_snake_case)]
pub fn TODO_INST(s: &str) {
    log_err(format!("ERR: TODO: {s}").as_str());
    todo!("TODO")
}
