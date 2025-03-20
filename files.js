// The best filesystem for promises and array manipulation
import run from "atocha";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import swear from "swear";

// Find whether it's Linux or Mac, where we can use `find`
const mac = () => process.platform === "darwin";
const linux = () => process.platform === "linux";

// Retrieve the full, absolute path for the path
const abs = swear(async (name = ".", base = process.cwd()) => {
  name = await name;
  base = await base;

  // Absolute paths do not need more absolutism
  if (path.isAbsolute(name)) return name;

  if (name.slice(0, 2) === "~/") {
    base = await home();
    name = name.slice(2);
  }

  // We are off-base here; recover the viable base option
  if (!base || typeof base !== "string") {
    base = process.cwd();
  }

  // Return the file/folder within the base
  return join(base, name);
});

const copy = swear(async (src, dst) => {
  src = await abs(src);
  dst = await abs(dst);
  await mkdir(dir(dst));
  await fsp.copyFile(src, dst);
  return dst;
});

// Get the directory from path
const dir = swear(async (name = ".") => {
  name = await abs(name);
  return path.dirname(name);
});

// Check whether a filename exists or not
const exists = swear(async (name) => {
  name = await abs(name);
  return fsp.access(name).then(
    () => true,
    () => false,
  );
});

// Get the home directory: https://stackoverflow.com/a/9081436/938236
const home = swear((...args) => join(homedir(), ...args).then(mkdir));

// Put several path segments together
const join = swear((...parts) => abs(path.join(...parts)));

// List all the files in the folder
const list = swear(async (dir) => {
  dir = await abs(dir);
  return swear(fsp.readdir(dir)).map((file) => abs(file, dir));
});

// Create a new directory in the specified path
// Note: `recursive` flag on Node.js is ONLY for Mac and Windows (not Linux), so
// it's totally worthless for us
const mkdir = swear(async (name) => {
  name = await abs(name);

  // Create a recursive list of paths to create, from the highest to the lowest
  const list = name
    .split(path.sep)
    .map((part, i, all) => all.slice(0, i + 1).join(path.sep))
    .filter(Boolean);

  // Build each nested path sequentially
  for (let path of list) {
    if (await exists(path)) continue;
    await fsp.mkdir(path).catch(() => null);
  }
  return name;
});

const move = swear(async (src, dst) => {
  try {
    src = await abs(src);
    dst = await abs(dst);
    await mkdir(dir(dst));
    await fsp.rename(src, dst);
    return dst;
  } catch (error) {
    // Some OS/environments don't allow move, so copy it first
    // and then remove the original
    if (error.code === "EXDEV") {
      await copy(src, dst);
      await remove(src);
      return dst;
    } else {
      throw error;
    }
  }
});

// Get the path's filename
const name = swear((file) => path.basename(file));

// Read the contents of a single file
const read = swear(async (name, options = {}) => {
  name = await abs(name);
  const type = options && options.type ? options.type : "text";
  if (type === "text") {
    return fsp.readFile(name, "utf-8").catch(() => null);
  }
  if (type === "json") {
    return read(name).then(JSON.parse);
  }
  if (type === "raw" || type === "buffer") {
    return fsp.readFile(name).catch(() => null);
  }
  if (type === "stream" || type === "web" || type === "webStream") {
    const file = await fsp.open(name);
    return file.readableWebStream();
  }
  if (type === "node" || type === "nodeStream") {
    return fs.createReadStream(name);
  }
});

// Delete a file or directory (recursively)
const remove = swear(async (name) => {
  name = await abs(name);
  if (name === "/") throw new Error("Cannot remove the root folder `/`");
  if (!(await exists(name))) return name;

  if (await stat(name).isDirectory()) {
    // Remove all content recursively
    await list(name).map(remove);
    await fsp.rmdir(name).catch(() => null);
  } else {
    await fsp.unlink(name).catch(() => null);
  }
  return name;
});

const sep = path.sep;

// Get some interesting info from the path
const stat = swear(async (name) => {
  name = await abs(name);
  return fsp.lstat(name).catch(() => null);
});

// Get a temporary folder
const tmp = swear(async (...args) => {
  const path = await join(tmpdir(), ...args);
  return mkdir(path);
});

// Perform a recursive walk
const rWalk = (name) => {
  const file = abs(name);

  const deeper = async (file) => {
    if (await stat(file).isDirectory()) {
      return rWalk(file);
    }
    return [file];
  };

  // Note: list() already wraps the promise
  return list(file)
    .map(deeper)
    .reduce((all, arr) => all.concat(arr), []);
};

// Attempt to make an OS walk, and fallback to the recursive one
const walk = swear(async (name) => {
  name = await abs(name);
  if (!(await exists(name))) return [];
  if (linux() || mac()) {
    try {
      // Avoid double forward slash when it ends in "/"
      name = name.replace(/\/$/, "");
      // Attempt to invoke run (command may fail for large directories)
      return await run(`find ${name} -type f`).split("\n").filter(Boolean);
    } catch (error) {
      // Fall back to rWalk() below
    }
  }
  return rWalk(name).filter(Boolean);
});

// Create a new file with the specified contents
const write = swear(async (name, body = "") => {
  name = await abs(name);
  // If it's a WebStream, convert it to a normal node stream
  if (body && body.pipeTo) {
    body = Readable.fromWeb(body);
  }
  if (body && body.then) {
    body = await body;
  }
  // If it's a type that is not a string nor a stream, convert it
  // into plain text with JSON.stringify
  if (
    body &&
    typeof body !== "string" &&
    !body.pipe &&
    !(body instanceof Buffer)
  ) {
    body = JSON.stringify(body);
  }
  await mkdir(dir(name));
  await fsp.writeFile(name, body, "utf-8");
  return name;
});

const files = {
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
  rename: move,
  sep,
  stat,
  swear,
  tmp,
  walk,
  write,
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
  sep,
  stat,
  swear,
  tmp,
  walk,
  write,
};

export default files;
