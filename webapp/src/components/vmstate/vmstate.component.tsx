import { VmState } from "armvm"
import './vmstate.css'


export const VmStateComponent = (props: { vmState: VmState, dummy: number }) => {
    const { vmState } = props

    const hexValComponent = (val: number) => {
        const hexVal = val ? val.toString(16) : ''
        const hexPad = hexVal.padStart(64, '0').substring(0, 64 - hexVal.length)

        return <span className="hex">
        <span className="hex-pad">0x{hexPad}</span><span className="hex-val">{hexVal}</span>
        </span>
    }

    // console.log("Rending VmStateComponent")
    return <>
        <table className="registers">
            <thead>
                <tr>
                    <th>Register</th>
                    <th>Decimal</th>
                    <th>Hex</th>
                </tr>
            </thead>
            <tbody>
                {vmState.gpr.map((val: any, i: number) => {
                    return <tr key={i}>
                        <td>X{i}</td>
                        <td>{val}</td>
                        <td>{hexValComponent(val)}</td>
                    </tr>
                })}
                <tr>
                    <td>SP</td>
                    <td>{vmState.spr.sp.toString()}</td>
                    <td>{hexValComponent(Number(vmState.spr.sp))}</td>
                </tr>
                <tr>
                    <td>PC</td>
                    <td>{vmState.spr.pc.toString()}</td>
                    <td>{hexValComponent(Number(vmState.spr.pc))}</td>
                </tr>
            </tbody>
        </table>
        <pre></pre>
    </>
}