import ArmVM from "./armvm";

export const STD_LIB: Record<string, (vm: ArmVM) => void> = {
    'printf': (vm: ArmVM) => {
        const args = vm.state.gpr
        const addr = args[0] as number
        // const code = vm.codes[addr.codeName]

        // let i = code.byteLines[addr.row-1]
        // const bytes = code.readBytes(i, 1)
        // while (bytes[bytes.length-1] !== 0) {
        //     i++
        //     bytes.push(vm.codes[addr.codeName].readBytes(i, 1)[0])
        // }

        // console.log("%cSTDLIB: printf", 'background: #222; color: #bada55', bytesToStr(bytes), args[1], args[2])
        console.log("%cSTDLIB: printf", 'background: #222; color: #bada55', args[0], args[1], args[2])
    }
}