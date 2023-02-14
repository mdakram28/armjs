interface WaitingReader {
    cb: (bytes: number[]) => void
    numBytes: number
    chunkSize: number
}

export class IOStream {
    buffer: number[]
    waitingReaders: WaitingReader[]

    constructor() {
        this.buffer = []
        this.waitingReaders = []
    }

    write(bytes: number[]) {
        this.buffer.push(...bytes)
        this.flush()
    }

    flush() {
        while(this.waitingReaders.length > 0 && this.waitingReaders[0].chunkSize <= this.buffer.length) {
            this.waitingReaders[0].cb(this.buffer.splice(0, this.waitingReaders[0].chunkSize))
            this.waitingReaders[0].numBytes -= this.waitingReaders[0].chunkSize
            if (this.waitingReaders[0].numBytes <= 0) {
                this.waitingReaders.shift()
            }
        }
    }

    read(numBytes: number, chunkSize: number, cb: (bytes: number[]) => void): void {
        this.waitingReaders.push({numBytes, chunkSize, cb})
        this.flush()
    }
}

