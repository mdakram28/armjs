import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import './App.css';
import './armvm/armvm';
import ArmVM from './armvm/armvm';
import { AsmSyntaxError } from './armvm/errors';
import { Inst } from './armvm/inst/inst';
import { EditorComponent } from './components/editor/editor.component';
import { VmStateComponent } from './components/vmstate/vmstate.component';

function App() {
  const [vm, setVm] = useState<ArmVM>()
  const [dummy, setDummy] = useState<number>(0)
  const [isRunning, setIsRunning] = useState(false)
  const [code, setCode] = useState("")
  const [errors, setError] = useState<AsmSyntaxError[]>([])
  const [currentLine, setCurrentLine] = useState<number>()

  useEffect(() => {
    resetVM()
  }, [])

  useEffect(() => {
    if (isRunning) {
      const timerId = setInterval(() => {
        try {
          runLine()
        } catch (err) {
          clearInterval(timerId)
          setError([err as any])
          throw err
        }
      }, 300);
      return () => clearInterval(timerId);
    }
  }, [isRunning, vm]);

  function resetVM() {
    console.clear()
    setIsRunning(false)
    setDummy(0)
    fetch("/test.asm").then(res => res.text()).then(test1Code => {
      fetch("/test2.asm").then(res => res.text()).then(test2Code => {
        setCode(test1Code)
        const vm = new ArmVM()
        setVm(vm)
        setCurrentLine(undefined)
        try {
          vm.load('test.asm', test1Code)
          vm.load('test2.asm', test2Code)
          vm.gotoMain()
        } catch (err) {
          setError([err as any])
          throw err 
        }
      })
    })
  }

  function runLine() {
    vm?.runLine()
    const pcVal = vm?.state.ram[Number(vm?.state.spr.pc)]
    if (pcVal instanceof Inst) {
      setCurrentLine(pcVal.addr.row)
    } else {
      setCurrentLine(undefined)
    }
  }

  function toggleRunning() {
    setIsRunning(!isRunning)
  }

  return (
    <div className="App">
      <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel>
          <EditorComponent text={code} errors={errors} currentLine={currentLine}/>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={25}>
          <button onClick={resetVM} style={{ 'fontSize': 25 }}>Reset VM</button> {dummy}
          <br />
          <button onClick={runLine} style={{ 'fontSize': 25 }}>Execute one Instruction</button>
          <br />
          <button onClick={toggleRunning} style={{ 'fontSize': 25 }}>{isRunning ? 'Stop' : 'Start'}</button>
          {vm &&
            <>
              <VmStateComponent vmState={vm.state} dummy={dummy}></VmStateComponent>
            </>
          }
        </Panel>
      </PanelGroup>

    </div>
  );
}

export default App;
