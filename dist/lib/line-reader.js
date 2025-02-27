"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("thenForEach");
class LineReader {
    constructor(_file, _chunkSize = 8 * 1024) {
        this._file = _file;
        this._chunkSize = _chunkSize;
        this._lastLine = '';
        this._bytesRead = 0;
        this._lineNum = -1;
    }
    _readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
    _arrBuf2String(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }
    _buf2Lines(buf) {
        this._bytesRead += buf.byteLength;
        const lines = [this._lastLine, this._arrBuf2String(buf)].join("").split(/\r?\n|\r(?!\n)/);
        this._lastLine = lines.pop();
        return lines;
    }
    _cleanUp() {
        this._file = null;
        this._chunkSize = null;
        this._lastLine = null;
        this._bytesRead = null;
        this._lineNum = null;
        this._continue = null;
        return Promise.resolve(); // this will help in chaining promises
    }
    forEachLine(fn, context) {
        if (this._bytesRead >= this._file.size) { // No more content in the file
            if (!this._lastLine)
                return Promise.resolve(context);
            return Promise.resolve(this._lastLine)
                .then((line) => fn(line, this._lineNum += 1, context))
                .then(() => this._cleanUp())
                .then(() => context);
        }
        else { // File still have some content to read
            const b = this._file.slice(this._bytesRead, this._bytesRead + this._chunkSize);
            return this._readFile(b)
                .then((buf) => this._buf2Lines(buf))
                .thenForEach((line) => this._continue = fn(line, this._lineNum += 1, context))
                .then(() => this._continue === false ? this._cleanUp().then(() => context) : this.forEachLine(fn, context));
        }
    }
}
exports.LineReader = LineReader;
//# sourceMappingURL=line-reader.js.map