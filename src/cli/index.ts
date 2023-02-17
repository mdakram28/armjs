import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import ArmVM from '../armvm/armvm';

const sourceFilePath = process.argv[1]

function onStdout([b]: number[]) {
    process.stdout.write(String.fromCharCode(b))
}

fs.readFile(sourceFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const vm = new ArmVM()
    vm.load(sourceFilePath.split(path.sep).reverse()[0], data)
    vm.FD[1].read(Infinity, 1, onStdout)
    vm.gotoMain()
});