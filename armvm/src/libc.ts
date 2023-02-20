import { ArmVM } from "./armvm";
import { bytesToStr, strToBytes } from "./util";

const regex = /%[-+ #0]?(\d+|\*)?(\.\d+|\.\*)?(hh|h|l|ll|j|z|t|L)?[duoxXfFeEgGaAcspn]/g

export const STD_LIB: Record<string, (vm: ArmVM) => void> = {
    'printf': (vm: ArmVM) => {
        const args = vm._state.gpr
        let addr = args[0]
        const bytes: number[] = []

        do {
            bytes.push(vm._state.ram[addr] as number)
            addr++
        } while (vm._state.ram[addr] !== 0)

        const fmt = bytesToStr(bytes)

        // let match;
        let argNum = 1
        // while ((match = regex.exec(fmt)) !== null) {
        //     console.log(`Found ${match[0]}. Next starts at ${regex.lastIndex}.`);
        //     if (match[0] === '%d') {

        //     }
        //     argNum++
        // }
        // console.log("%cSTDLIB: printf", 'background: #222; color: #bada55', fmt, bytes, vm.state.ram[args[0]+5])

        const finalBytes = strToBytes(fmt.replace(regex, pstr => {
            const arg = args[argNum++]
            if (pstr === '%d') return arg.toString()
            return `<${pstr} is unsupported>`
        })).slice(0, -1)



        // console.log("%cSTDLIB: printf", 'background: #222; color: #bada55', bytesToStr(bytes), args[1], args[2])
        vm.FD[1].write(finalBytes)
    }
}