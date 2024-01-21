#!/usr/bin/env node

import { program } from "commander";
import { stat, unlink } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { resolve } from "path";
import { zip } from "compressing";
// import inquirer from "inquirer";
// import { createGzip } from "zlib";
// import { pipeline } from "stream";

const hasFileOrDir = async (filename: string, isFile = true) => {
  try {
    const path = resolve(filename);
    const stats = await stat(path);
    return stats[isFile ? "isFile" : "isDirectory"]() && path;
  } catch {
    return false;
  }
};

const readPkgName = async (path: string) => {
  const rs = createReadStream(path, "utf-8");
  let incompleteLine = "",
    name;
  for await (const chunk of rs) {
    const lines = (incompleteLine + chunk).split("\n");
    for (const line of lines) {
      const [, _name] = line.trim().match(/"name":\s?"(.+)"/) ?? [];
      if (_name) {
        name = _name;
        break;
      }
    }
  }
  return name;
};

const clean = async (path: string) => {
  if (await hasFileOrDir(path)) {
    await unlink(path);
  }
};

const compress = async (source: string, target: string) => {
  await clean(target);
  await zip.compressDir(source, target);
  console.log("compress success!");
};

program
  .command("gen-zip [name]")
  .usage("[zip name]")
  .version("1.0.0")
  .option("-f --format", "zip format", "zip")
  .option("-s --source", "source name", "dist")
  .action(async (name, cmd) => {
    // const gzipper = createGzip();
    const { format, source: sourceName } = cmd;
    const sourcePath = await hasFileOrDir(sourceName, false);
    if (sourcePath) {
      if (name) {
        compress(sourceName, `${name}.${format}`);
      } else {
        const pkgPath = await hasFileOrDir("package.json");
        if (pkgPath) {
          const pkgName = await readPkgName(pkgPath);
          if (pkgName) {
            // const source = createReadStream(sourceName);
            // const destination = createWriteStream(`${pkgPath}.${format}`);
            compress(sourcePath, `${pkgName}.${format}`);
          }
        }
      }
    } else {
      console.warn("source must be a folder");
    }
  })
  .parse(process.argv);
