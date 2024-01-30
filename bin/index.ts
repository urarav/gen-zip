#!/usr/bin/env node

import { program } from "commander";
import { stat, unlink } from "fs/promises";
import { createReadStream } from "fs";
import { resolve } from "path";
import { zip } from "compressing";

const hasFileOrDir = async (filename: string, isFile = true) => {
  try {
    const path = resolve(filename);
    const stats = await stat(path);
    return stats[isFile ? "isFile" : "isDirectory"]() && path;
  } catch {
    return false;
  }
};

const readPkg = async (path: string, key = "name") => {
  const rs = createReadStream(path, "utf-8");
  let incompleteLine = "",
    val;
  for await (const chunk of rs) {
    const lines = (incompleteLine + chunk).split("\n");
    for (const line of lines) {
      const [, _val] =
        line.trim().match(new RegExp(`"${key}":\\s?"(.+)"`, "i")) ?? [];
      if (_val) {
        val = _val;
        break;
      }
    }
  }
  return val;
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

readPkg(resolve(__dirname, "../package.json"), "version")
  .then((version = "1.0.0") => {
    program
      .command("gen-zip [name]")
      .usage("[zip name]")
      .version(version)
      .option("-f --format <ext>", "zip format", "zip")
      .option("-s --source <name>", "source name", "dist")
      .action(async (name, cmd) => {
        const { format, source: sourceName } = cmd;
        const sourcePath = await hasFileOrDir(sourceName, false);
        if (sourcePath) {
          if (name) {
            compress(sourceName, `${name}.${format}`);
          } else {
            const pkgPath = await hasFileOrDir("package.json");
            if (pkgPath) {
              const pkgName = await readPkg(pkgPath);
              if (pkgName) {
                compress(sourcePath, `${pkgName}.${format}`);
              }
            }
          }
        } else {
          console.warn("source must be a folder");
        }
      })
      .parse(process.argv);
  })
  .catch(console.warn);
