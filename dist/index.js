#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
// import inquirer from "inquirer";
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const compressing_1 = require("compressing");
// import { createGzip } from "zlib";
// import { pipeline } from "stream";
const hasFileOrDir = (filename, isFile = true) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const path = (0, path_1.resolve)(filename);
        const stats = yield (0, promises_1.stat)(path);
        return stats[isFile ? "isFile" : "isDirectory"]() && path;
    }
    catch (_a) {
        return false;
    }
});
const readPkgName = (path) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, e_1, _c, _d;
    var _e;
    const rs = (0, fs_1.createReadStream)(path, "utf-8");
    let incompleteLine = "", name;
    try {
        for (var _f = true, rs_1 = __asyncValues(rs), rs_1_1; rs_1_1 = yield rs_1.next(), _b = rs_1_1.done, !_b; _f = true) {
            _d = rs_1_1.value;
            _f = false;
            const chunk = _d;
            const lines = (incompleteLine + chunk).split("\n");
            for (const line of lines) {
                const [, _name] = (_e = line.trim().match(/"name":\s?"(.+)"/)) !== null && _e !== void 0 ? _e : [];
                if (_name) {
                    name = _name;
                    break;
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_f && !_b && (_c = rs_1.return)) yield _c.call(rs_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return name;
});
const clean = (path) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield hasFileOrDir(path)) {
        yield (0, promises_1.unlink)(path);
    }
});
const compress = (source, target) => __awaiter(void 0, void 0, void 0, function* () {
    yield clean(target);
    yield compressing_1.zip.compressDir(source, target);
    console.log("compress success!");
});
commander_1.program
    .command("gen-zip [name]")
    .usage("[zip name]")
    .version("1.0.0")
    .option("-f --format", "zip format", "zip")
    .option("-s --source", "source name", "dist")
    .action((name, cmd) => __awaiter(void 0, void 0, void 0, function* () {
    // const gzipper = createGzip();
    const { format, source: sourceName } = cmd;
    const sourcePath = yield hasFileOrDir(sourceName, false);
    if (sourcePath) {
        if (name) {
            compress(sourceName, `${name}.${format}`);
        }
        else {
            const pkgPath = yield hasFileOrDir("package.json");
            if (pkgPath) {
                const pkgName = yield readPkgName(pkgPath);
                if (pkgName) {
                    // const source = createReadStream(sourceName);
                    // const destination = createWriteStream(`${pkgPath}.${format}`);
                    compress(sourcePath, `${pkgName}.${format}`);
                }
            }
        }
    }
    else {
        console.warn("source must be a folder");
    }
}))
    .parse(process.argv);
