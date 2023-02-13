import { useEffect, useState } from 'react';
import './App.css';
import './armvm/armvm';
import ArmVM from './armvm/armvm';
import { VmStateComponent } from './components/vmstate/vmstate.component';

function App() {
  const [vm, setVm] = useState<ArmVM>()
  const [dummy, setDummy] = useState<number>(0)

  useEffect(() => {
    resetVM()
  }, [])

  function resetVM() {
    console.clear()
    fetch("/test.asm")
      .then(res => res.text())
      .then(text => {
        const vm = new ArmVM()
        vm.load('test.asm', text)
        vm.gotoMain()
        setVm(vm)
      })
  }

  function runLine() {
    vm?.runLine()
    setDummy(dummy+1)
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={resetVM} style={{ 'fontSize': 25 }}>Reset VM</button>
        <br/>
        <button onClick={runLine} style={{ 'fontSize': 25 }}>Execute one Instruction</button>
        {vm &&
          <>
            <VmStateComponent vmState={vm.state} dummy={dummy}></VmStateComponent>
          </>
        }
      </header>
    </div>
  );
}

export default App;
