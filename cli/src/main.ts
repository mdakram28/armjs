import * as fs from 'fs';
import * as process from 'process';

const sourceFilePath = process.argv[2]

// function onStdout([b]: number[]): void {
//     const c = String.fromCharCode(b)
//     // process.stdout.write(c)
// }

function timeIt(callback: () => void) {
    const start = Date.now()
    try {
        callback()
    } catch (err) {
        console.error(err)
    }
    finally {
        const end = Date.now();
        return end - start;
    }
}

// fs.readFile(sourceFilePath, 'utf8', (err, data) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
// const vm = new ArmVM()
// vm.load(sourceFilePath.split(path.sep).reverse()[0], data)
// console.log("Loading...")
// vm.FD[1].read(Infinity, 1, onStdout)
// vm.gotoMain()    let i1 = 0
// const time1 = timeIt(() => {
//     while (true) {
//         vm.runLine()
//         i1++
//     }
// })
// console.log(`time1 = ${time1}`)


// const vm2 = ArmV8Core.new();
// vm2.inst_load(0xd280021d);
// vm2.inst_run();
// // console.log(vm.get_state().gpr)

// let i2 = 0
// const time2 = timeIt(() => {
//     while (i2 < 100000) {
//         vm2.inst_run()
//         i2++
//     }
// })

// console.log(`time2 = ${time2}`)


// const startTime = Date.now()
// try {

// } finally {
//     const endTime = Date.now()
//     console.log(`NUM_INSTRUCTIONS = ${i}, RUNTIME = ${endTime - startTime} ms`)
// }
// });

// elfy.constants = require('./elfy/constants');
const elfyParser = require('./elfy/parser');

// elfy.parse = function parse(buf) {
//   return ;
// };

fs.open(sourceFilePath, 'r', (status, fd) => {
    if (status) {
        console.log(status.message);
        return;
    }
    var buffer = Buffer.alloc(10000);
    fs.read(fd, buffer, 0, 10000, 0, function (err, num) {
        // console.log(buffer.toString('hex', 0, num));
        const parsed = new elfyParser().execute(buffer)
        const sections = parsed.body.sections
        const textSection = sections.filter((s: any) => s.name === '.text')[0]
        const gotSection = sections.filter((s: any) => s.name === '.got')[0]
        if (!textSection) throw Error(".text section not found in binary")
        const insts: Buffer = textSection.data
        console.log(sections)
        // return;

        // const vm = ArmV8Core.new()
        // vm.ram_load(new Float64Array(insts), 0n);
        // vm.ram_load(new Float64Array(gotSection.data), BigInt(gotSection.addr));

        // const numInst = 12;
        // for (let i = 0; i < numInst; i++) {
        //     vm.inst_load(insts.readUInt32LE(i * 4));
        // }

        // console.log("Total time to run : ", timeIt(() => {
        //     vm.inst_run(numInst);
        // }))
        // console.log("-----------------RESULT")
        // console.log(vm.get_state().gpr, vm.get_state().spr);
    });
})