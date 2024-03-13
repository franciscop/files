import { Readable } from "node:stream";

type fileName = string;
type dirName = string;
type pathName = fileName | dirName;
type Types = "text" | "json" | "buffer" | "web" | "node";
type contentType = string | {} | [] | Buffer | Readable | ReadableStream;

declare const abs: (
  fileName?: fileName,
  basePath?: dirName
) => Promise<fileName>;
declare const copy: (
  source: fileName,
  destination: fileName
) => Promise<string>;
declare const dir: (fileName?: fileName) => Promise<dirName>;
declare const exists: (fileName: fileName) => Promise<boolean>;
declare const home: (...paths: string[]) => Promise<pathName>;
declare const join: (...paths: string[]) => Promise<pathName>;
declare const list: (dirName?: dirName) => Promise<fileName[]>;
declare const mkdir: (dirName?: dirName) => Promise<dirName>;
declare const move: (src: fileName, dst: fileName) => Promise<fileName>;
declare const name: (fileName: fileName) => Promise<string>;
declare const read: (
  fileName: fileName,
  { type }?: { type: Types }
) => Promise<string>;
declare const remove: (pathName?: pathName) => Promise<pathName>;
declare const stat: (fileName: fileName) => Promise<any>;
declare const swear: (arg: Promise<any> | (() => Promise<any>)) => Promise<any>;
declare const tmp: (...paths: string[]) => Promise<dirName>;
declare const walk: (dirName?: dirName) => Promise<fileName[]>;
declare const write: (
  fileName: fileName,
  content: contentType
) => Promise<fileName>;

declare const Files: {
  abs: typeof abs;
  copy: typeof copy;
  dir: typeof dir;
  exists: typeof exists;
  home: typeof home;
  join: typeof join;
  list: typeof list;
  mkdir: typeof mkdir;
  move: typeof move;
  name: typeof name;
  read: typeof read;
  remove: typeof remove;
  rename: typeof move;
  stat: typeof stat;
  swear: typeof swear;
  tmp: typeof tmp;
  walk: typeof walk;
  write: typeof write;
};

export {
  abs,
  copy,
  dir,
  exists,
  home,
  join,
  list,
  mkdir,
  move,
  name,
  read,
  remove,
  move as rename,
  stat,
  swear,
  tmp,
  walk,
  write,
};
export default Files;
