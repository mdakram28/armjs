import { VmState } from "../../armvm/armvm"

export const VmStateComponent = (props: { vmState: VmState , dummy: number}) => {
    const { vmState } = props

    // console.log("Rending VmStateComponent")
    return <>
        <pre>{JSON.stringify(vmState, null, 4)}</pre>
    </>
}