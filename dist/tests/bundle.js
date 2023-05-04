(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var line_reader_1 = require("./lib/line-reader");
exports.LineReader = line_reader_1.LineReader;

},{"./lib/line-reader":2}],2:[function(require,module,exports){
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

},{"thenForEach":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
document.querySelector("input.fullFile").onchange = () => {
    console.log("fullFile");
    const input = document.querySelector("input.fullFile");
    if (!input.files.length)
        return;
    const lr = new index_1.LineReader(input.files[0], 4 * 1024);
    lr.forEachLine((line, i) => console.log(i, line)).then(() => console.log("Done!"));
};
document.querySelector("input.someLines").onchange = () => {
    console.log("someLines");
    const input = document.querySelector("input.someLines");
    if (!input.files.length)
        return;
    const lr = new index_1.LineReader(input.files[0], 4 * 1024);
    lr.forEachLine((line, i) => (i === 10 ? false : console.log(i, line))).then(() => console.log("Done!"));
};

},{"../index":1}],4:[function(require,module,exports){
function thenForEach(doFn, context) {
    return this.then(validate).then(() => context);
    function validate(arrOrIterable) {
        let i = -1;
        if (arrOrIterable.context && arrOrIterable.arrOrIterable) {
            context = arrOrIterable.context;
            arrOrIterable = arrOrIterable.arrOrIterable;
        }
        if (Array.isArray(arrOrIterable)) {
            return iterateArr(arrOrIterable, i, context, doFn);
        }
        else if (typeof arrOrIterable[Symbol.iterator] === 'function') {
            return iterateIterable(arrOrIterable, i, context, doFn);
        }
        else {
            throw `Error: thenForEach must receive an array or iterable but ${typeof arrOrIterable} received.`;
        }
    }
}
function iterateArr(arr, i, context, doFn) {
    if (!arr.length)
        return;
    const item = arr.shift();
    return Promise.resolve(item)
        .then((item) => doFn(item, i += 1, context))
        .then((_continue) => _continue !== false && iterateArr(arr, i, context, doFn));
}
function iterateIterable(iterable, i, context, doFn) {
    const item = iterable.next();
    if (item.done)
        return;
    return Promise.resolve(item.value)
        .then((item) => doFn(item, i += 1, context))
        .then((_continue) => _continue !== false && iterateIterable(iterable, i, context, doFn));
}
// The pattern of extending global or third party class has been copied from rxjs/add/operator in angular2
Promise.prototype.thenForEach = thenForEach;

},{}]},{},[3]);
