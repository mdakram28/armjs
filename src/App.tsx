import { Drawer } from 'antd';
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
  const [termOpen, setTermOpen] = useState(false)
  const [termContent, setTermContent] = useState("")

  useEffect(() => {
    resetVM()
  }, [])

  useEffect(() => {
    if (isRunning) {
      const timerId = setInterval(() => {
        try {
          for(let i=0; i<1000000; i++) {
            runLine()
          }
        } catch (err) {
          clearInterval(timerId)
          setError([err as any])
          setIsRunning(false)
          throw err
        }
      }, 0);
      return () => clearInterval(timerId);
    }
  }, [isRunning, vm]);

  function onStdout([b]: number[]) {
    // console.log("received byte on stdout: ", b)
    setTermContent(content  => content + String.fromCharCode(b))
  }

  function resetVM() {
    console.clear()
    setTermContent('')
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
          vm.FD[1].read(Infinity, 1, onStdout)
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
    if(!isRunning) {
      setTermOpen(true)
    }
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
          <br/>
          <button onClick={() => setTermOpen(true)} style={{ 'fontSize': 25 }}>Open Terminal</button>

          {vm &&
            <>
              <VmStateComponent vmState={vm.state} dummy={dummy}></VmStateComponent>
            </>
          }
        </Panel>
      </PanelGroup>

      <Drawer title="Standard Input/Output" placement="bottom" onClose={() => setTermOpen(false)} open={termOpen}>
        Terminal:
        <pre>{termContent}</pre>
      </Drawer>

    </div>
  );
}

export default App;
