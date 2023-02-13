import ArmVM from "./armvm";
import { CodeAddr } from "./types";
import { bytesToStr } from "./util";

export const STD_LIB: Record<string, (vm: ArmVM) => void> = {
    'printf': (vm: ArmVM) => {
        const args = vm.state.gpr
        const addr = args[0] as unknown as CodeAddr
        const code = vm.codes[addr.n]

        let i = code.byteLines[addr.r-1]
        const bytes = code.readBytes(i, 1)
        while (bytes[bytes.length-1] !== 0) {
            i++
            bytes.push(vm.codes[addr.n].readBytes(i, 1)[0])
        }

        console.log("%cSTDLIB: printf", 'background: #222; color: #bada55', bytesToStr(bytes), args[1], args[2])
    }
}