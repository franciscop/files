// Native file system and path
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import { promisify } from "util";

import cmd from "atocha";
import swear from "swear";

// fs-promises
import {
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
  rename,
  sep,
  stat,
  tmp,
  walk,
  write,
} from ".";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find whether it's Linux or Mac, where we can use `find`
const mac = () => process.platform === "darwin";
const linux = () => process.platform === "linux";
const windows = () => process.platform === "win32";
const unix = () => mac() || linux();

const root = linux() ? "/home/" : mac() ? "/Users/" : "C:\\projects";

describe("abs", () => {
  it("gets the defaults right", async () => {
    expect(await abs()).toBe(__dirname);
    expect(await abs("demo")).toBe(await join(__dirname, "/demo"));
  });

  it("works with swear()", async () => {
    expect(await abs(swear("demo"))).toBe(await join(__dirname, "/demo"));
  });

  it("get the absolute path of the passed args", async () => {
    expect(await abs("demo", process.cwd())).toBe(
      await join(__dirname, "/demo")
    );
    expect(await abs("demo", __dirname)).toBe(await join(__dirname, "/demo"));
  });

  it("ignores the second parameter if not a string", async () => {
    expect(await abs("demo", 0)).toBe(await join(__dirname, "/demo"));
    expect(await abs("demo", 5)).toBe(await join(__dirname, "/demo"));
    expect(await abs("demo", true)).toBe(await join(__dirname, "/demo"));
  });

  it("works with home", async () => {
    expect(await abs("~/")).toBe(await home());
    expect(await abs("~/hello")).toBe((await home()) + "/hello");
    expect(await abs("~/hello/")).toBe((await home()) + "/hello/");
  });
});

describe("copy", () => {
  const src = "demo/a/readme.md";

  // Create and destroy it for each test
  it("copy the file maintaining the original", async () => {
    const dst = "demo/abc.md";
    await remove(dst);
    expect(await exists(src)).toBe(true);
    expect(await exists(dst)).toBe(false);

    const res = await copy(src, dst);
    expect(await exists(src)).toBe(true);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove(dst);
  });

  it("copy the file into a nested structure", async () => {
    const dst = "demo/copy/readme.md";
    await remove(dst);

    expect(await exists(src)).toBe(true);
    expect(await exists(dst)).toBe(false);

    const res = await copy(src, dst);
    expect(await exists(src)).toBe(true);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove("demo/copy");
  });
});

describe("dir", () => {
  it("defaults to the current dir", async () => {
    expect(await dir()).toContain(root);
  });

  it("returns the parent if already a path", async () => {
    expect(await dir("demo/a")).toContain(`files${sep}demo`);
    expect(await dir("demo/a")).not.toContain(`files${sep}demo${sep}a`);
    expect(await dir("demo/a/")).toContain(`files${sep}demo`);
    expect(await dir("demo/a/")).not.toContain(`files${sep}demo${sep}a`);
  });

  it("works with swear()", async () => {
    expect(await dir(swear("demo/a/b/readme.md"))).toContain(
      `files${sep}demo${sep}a${sep}b`
    );
  });

  it("can put the full folder path", async () => {
    expect(await dir("demo/a/b/readme.md")).toContain(
      `files${sep}demo${sep}a${sep}b`
    );
    expect(await dir(dir("demo/a/b/readme.md"))).not.toContain(
      `files${sep}demo${sep}a${sep}b`
    );
    expect(await dir(dir(dir("demo/a/b/readme.md")))).not.toContain(
      `files${sep}demo${sep}a`
    );
  });

  it("can work with relative paths", async () => {
    expect(await dir("./demo/")).toBe(
      await abs("./demo/")
        .replace(/(\/|\\)$/, "")
        .split(sep)
        .slice(0, -1)
        .join(sep)
    );
  });
});

describe("list", () => {
  it("defaults to the current folder", async () => {
    expect(await list()).toContain(__dirname + sep + "package.json");
  });

  it("works with swear()", async () => {
    expect(await list(swear(process.cwd()))).toContain(
      __dirname + sep + "package.json"
    );
  });

  it("can load the demo", async () => {
    const files = await list("demo", __dirname);
    expect(files).not.toContain(__dirname + sep + "package.json");
    expect(files).toContain(__dirname + sep + `demo${sep}a`);
    expect(files).toContain(__dirname + sep + `demo${sep}readme.md`);
  });
});

describe("exists", () => {
  it("defaults to the current dir", async () => {
    expect(await exists()).toBe(true);
  });

  it("works with swear()", async () => {
    expect(await exists()).toBe(true);
  });

  it("can check the demo", async () => {
    expect(await exists("demo")).toBe(true);
    expect(await exists("demo/readme.md")).toBe(true);
    expect(await exists(await home("Documents"))).toBe(true);
    expect(await exists("aaa")).toBe(false);
  });
});

describe("home", () => {
  const homeDir = unix() ? "echo $HOME" : "echo %systemdrive%%homepath%";
  it("uses the home directory", async () => {
    expect(await home()).toEqual(await cmd(homeDir));
    // expect((await home()).slice(-1)).toBe('/');
  });

  it("works with swear()", async () => {
    expect(await home(swear(""))).toContain(await cmd(homeDir));
  });
});

describe("join", () => {
  it("can do a simple join", async () => {
    expect(await join(__dirname, "demo")).toBe(path.join(__dirname, "demo"));
  });

  it("works with swear()", async () => {
    expect(await join(swear(__dirname), swear("demo"))).toBe(
      path.join(__dirname, "demo")
    );
  });
});

describe("mkdir", () => {
  beforeEach(async () =>
    promisify(fs.rmdir)(await abs("demo/b")).catch((err) => {})
  );
  afterEach(async () =>
    promisify(fs.rmdir)(await abs("demo/b")).catch((err) => {})
  );

  it("create a new directory", async () => {
    expect(await exists("demo/b")).toBe(false);
    const res = await mkdir("demo/b");
    expect(await exists("demo/b")).toBe(true);
    expect(res).toBe(await abs("demo/b"));
  });

  it("does not throw if it already exists", async () => {
    expect(await exists("demo/a")).toBe(true);
    const res = await mkdir("demo/a");
    expect(await exists("demo/a")).toBe(true);
    expect(res).toBe(await abs("demo/a"));
  });

  it("creates it even if the parent does not exist", async () => {
    await remove("demo/c");
    expect(await exists("demo/c")).toBe(false);
    const res = await mkdir("demo/c/d/e");
    expect(await exists("demo/c/d/e")).toBe(true);
    expect(res).toBe(await abs("demo/c/d/e"));
    await remove("demo/c");
  });
});

describe("move", () => {
  const src = "demo/move.txt";

  // Create and destroy it for each test
  beforeEach(() => write(src, "hello"));
  afterEach(() => remove(src));

  it("can simply move a file", async () => {
    const dst = "demo/move-zzz.txt";
    expect(await exists(dst)).toBe(false);

    const res = await move(src, dst);
    expect(await exists(src)).toBe(false);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove(dst);
  });

  it("can work with nested folders", async () => {
    const dst = "demo/move/zzz.txt";
    expect(await exists(dst)).toBe(false);

    const res = await move(src, dst);
    expect(await exists(src)).toBe(false);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove("demo/move");
  });

  it("works with folders", async () => {
    const src = "demo/move";
    const dst = "demo/moved";

    await write("demo/move/test.txt", "hello");
    expect(await exists(dst)).toBe(false);

    const res = await move(src, dst);
    expect(await exists(src)).toBe(false);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove(dst);
  });
});

describe("name", () => {
  it("find the file name in the path", async () => {
    expect(await name("demo/abs.js")).toBe("abs.js");
  });

  it("works with swear()", async () => {
    expect(await name(swear("demo/abs.js"))).toBe("abs.js");
    expect(await name(abs("demo/abs.js"))).toBe("abs.js");
  });

  it("performs well without extension", async () => {
    expect(await name("demo/abs")).toBe("abs");
    expect(await name(abs("demo/abs"))).toBe("abs");
  });
});

describe("read", () => {
  it("can read a markdown file", async () => {
    expect(await read("demo/readme.md")).toContain("# Hello!");
  });

  it("can webstream read it", async () => {
    const stream = await read("demo/readme.md", { type: "web" });
    const enc = new TextDecoder("utf-8");
    let str = "";
    for await (const chunk of stream) {
      str += enc.decode(chunk);
    }
    expect(str).toContain("# Hello!");
  });

  it("can nodestream read it", async () => {
    const stream = await read("demo/readme.md", { type: "node" });
    const enc = new TextDecoder("utf-8");
    let str = "";
    for await (const chunk of stream) {
      str += enc.decode(chunk);
    }
    expect(str).toContain("# Hello!");
  });

  it("works with swear()", async () => {
    expect(await read(swear("demo/readme.md"))).toContain("# Hello!");
  });

  it("is empty if it is not a file", async () => {
    expect(await read(swear("demo"))).toBe(null);
  });

  it("can auto-parse json", async () => {
    expect(await read("demo/test.json", { type: "json" })).toEqual({
      hello: "world",
    });
  });

  it("can json parse it", async () => {
    expect(await read("demo/test.json").then(JSON.parse)).toEqual({
      hello: "world",
    });
  });
});

describe("remove", () => {
  it("removes a file", async () => {
    await write("demo/remove.md", "Hello!");
    expect(await read("demo/remove.md")).toBe("Hello!");
    const file = await remove("demo/remove.md");
    expect(await exists("demo/remove.md")).toBe(false);
    expect(file).toBe(await abs("demo/remove.md"));
  });

  it("removes a directory", async () => {
    await mkdir("demo/b");
    expect(await exists("demo/b")).toBe(true);
    const file = await remove("demo/b");
    expect(await exists("demo/b")).toBe(false);
    expect(file).toBe(await abs("demo/b"));
  });

  it("removes a directory with files", async () => {
    await mkdir("demo/b");
    await write("demo/b/remove.md", "Hello!");
    expect(await exists("demo/b")).toBe(true);
    expect(await read("demo/b/remove.md")).toBe("Hello!");
    const file = await remove("demo/b");
    expect(await exists("demo/b")).toBe(false);
    expect(file).toBe(await abs("demo/b"));
  });

  it("removes a directory with deeply nested files", async () => {
    await mkdir("demo/x");
    await write("demo/x/remove.md", "Hello!");
    await mkdir("demo/x/c");
    await write("demo/x/c/remove.md", "Hello!");
    expect(await exists("demo/x")).toBe(true);
    expect(await read("demo/x/remove.md")).toBe("Hello!");
    expect(await exists("demo/x/c")).toBe(true);
    expect(await read("demo/x/c/remove.md")).toBe("Hello!");
    const file = await remove("demo/x");
    expect(await exists("demo/x")).toBe(false);
    expect(file).toBe(await abs("demo/x"));
  });

  it("cannot remove the root", async () => {
    if (typeof Bun !== "undefined") {
      // TODO: this seems buggy upstream in Bun
      await expect(
        new Promise((done, fail) =>
          remove("/").then(
            (val) => done(() => val),
            (err) => fail(() => err)
          )
        )
      ).rejects.toThrow(/remove the root/);
    } else {
      await expect(remove("/")).rejects.toThrow(/remove the root/);
    }
  });

  it("will ignore a non-existing file", async () => {
    expect(await exists("demo/d")).toBe(false);
    await expect(await remove("demo/d")).toEqual(await abs("demo/d"));
  });
});

describe("rename", () => {
  const src = "demo/rename.txt";

  // Create and destroy it for each test
  beforeEach(() => write(src, "hello"));
  afterEach(() => remove(src));

  it("can simply move a file", async () => {
    const dst = "demo/rename-zzz.txt";
    expect(await exists(dst)).toBe(false);

    const res = await rename(src, dst);
    expect(await exists(src)).toBe(false);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove(dst);
  });

  it("can work with nested folders", async () => {
    const dst = "demo/rename/zzz.txt";
    expect(await exists(dst)).toBe(false);

    const res = await rename(src, dst);
    expect(await exists(src)).toBe(false);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove("demo/rename");
  });

  it("works with folders", async () => {
    const src = "demo/rename";
    const dst = "demo/renamed";

    await write("demo/rename/test.txt", "hello");
    expect(await exists(dst)).toBe(false);

    const res = await rename(src, dst);
    expect(await exists(src)).toBe(false);
    expect(await exists(dst)).toBe(true);
    expect(res).toBe(await abs(dst));
    await remove(dst);
  });
});

describe("stat", () => {
  it("defaults to the current dir", async () => {
    expect(await stat().isDirectory()).toBe(true);
    expect(await stat(process.cwd()).isDirectory()).toBe(true);
    expect(await stat(__dirname).isDirectory()).toBe(true);
  });

  it("works with swear()", async () => {
    expect(await stat(swear(process.cwd())).isDirectory()).toBe(true);
    expect(await stat(swear(__dirname)).isDirectory()).toBe(true);
  });

  it("can analyze whether a path is a directory or not", async () => {
    expect(await stat("demo").isDirectory()).toBe(true);
    expect(await stat("demo/readme.md").isDirectory()).toBe(false);
    expect(await stat(__filename).isDirectory()).toBe(false);
  });

  it("can read some dates", async () => {
    const date = await stat("demo/readme.md").atime;
    expect(date.constructor.name).toBe("Date");
    expect(date).toEqual(new Date(date));
  });
});

describe("tmp", () => {
  it("works empty", async () => {
    if (linux()) {
      expect(await tmp()).toBe("/tmp");
    } else if (mac()) {
      expect((await tmp()) + "/").toBe(await cmd("echo $TMPDIR"));
    } else if (windows()) {
      expect(await tmp()).toBe("C:\\Users\\appveyor\\AppData\\Local\\Temp\\1");
    } else {
      console.log("Platform not supported officially");
    }
  });

  it("works with swear()", async () => {
    if (linux()) {
      expect(await tmp(swear("demo"))).toBe("/tmp/demo");
    } else if (mac()) {
      expect(await tmp("demo")).toBe((await cmd("echo $TMPDIR")) + "demo");
    } else if (windows()) {
      expect(await tmp("demo")).toBe(
        "C:\\Users\\appveyor\\AppData\\Local\\Temp\\1\\demo"
      );
    } else {
      console.log("Platform not supported officially");
    }
  });

  it("works with a path", async () => {
    if (linux()) {
      expect(await tmp("demo")).toBe("/tmp/demo");
    } else if (mac()) {
      expect(await tmp("demo")).toBe((await cmd("echo $TMPDIR")) + "demo");
    } else if (windows()) {
      expect(await tmp("demo")).toBe(
        "C:\\Users\\appveyor\\AppData\\Local\\Temp\\1\\demo"
      );
    } else {
      console.log("Platform not supported officially");
    }
  });

  it("can reset the doc", async () => {
    await tmp("demo").then(remove);
    expect(await tmp("demo").then(list)).toEqual([]);
    mkdir(await tmp("demo/a"));
    if (linux()) {
      expect(await tmp("demo").then(list)).toEqual(["/tmp/demo/a"]);
    } else if (mac()) {
      expect(await tmp("demo").then(list)).toEqual([
        (await cmd("echo $TMPDIR")) + "demo/a",
      ]);
    } else if (windows()) {
      expect(await tmp("demo").then(list)).toEqual([
        "C:\\Users\\appveyor\\AppData\\Local\\Temp\\1\\demo\\a",
      ]);
    } else {
      console.log("Platform not supported officially");
    }
    await tmp("demo").then(remove).then(mkdir);
    expect(await tmp("demo").then(list)).toEqual([]);
  });
});

describe("walk", () => {
  it("defaults to the current directory", async () => {
    expect(await walk()).toContain(__dirname + sep + "package.json");
  });

  it("works with swear()", async () => {
    expect(await walk(swear(process.cwd()))).toContain(
      __dirname + sep + "package.json"
    );
  });

  it("is empty if it doesn not exist", async () => {
    expect(await walk("demo/c")).toEqual([]);
  });

  it("can deep walk", async () => {
    const files = await walk("demo");
    expect(files).toContain(__dirname + sep + `demo${sep}readme.md`);
    expect(files).toContain(__dirname + sep + `demo${sep}a${sep}readme.md`);
    expect(files).toContain(
      __dirname + sep + `demo${sep}a${sep}b${sep}readme.md`
    );
  });
});

describe("write", () => {
  beforeEach(async () =>
    promisify(fs.unlink)(await abs("demo/deleteme.md")).catch((err) => {})
  );
  afterEach(async () =>
    promisify(fs.unlink)(await abs("demo/deleteme.md")).catch((err) => {})
  );

  it("creates a new file", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    await write("demo/deleteme.md", "Hello!");
    expect(await read("demo/deleteme.md")).toBe("Hello!");
    expect(await exists("demo/deleteme.md")).toBe(true);
  });

  it("creates a new file from JSON", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    await write("demo/deleteme.md", { hello: "world" });
    expect(await read("demo/deleteme.md")).toBe('{"hello":"world"}');
    expect(await exists("demo/deleteme.md")).toBe(true);
  });

  it("creates a new file from a buffer", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    await write("demo/deleteme.md", Buffer.from("Hello!", "utf8"));
    expect(await read("demo/deleteme.md")).toBe("Hello!");
    expect(await exists("demo/deleteme.md")).toBe(true);
  });

  it("creates a new file from a Readable", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    const stream = new Readable();
    stream.push("Hello!"); // the string you want
    stream.push(null); // indicates end-of-file basically - the end of the stream
    await write("demo/deleteme.md", stream);
    expect(await read("demo/deleteme.md")).toBe("Hello!");
    expect(await exists("demo/deleteme.md")).toBe(true);
  });

  it("creates a new file from a ReadableStream", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue("Hello!");
        controller.close();
      },
    });
    await write("demo/deleteme.md", stream);
    expect(await read("demo/deleteme.md")).toBe("Hello!");
    expect(await exists("demo/deleteme.md")).toBe(true);
  });

  it("creates a new empty file", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    await write("demo/deleteme.md");
    expect(await exists("demo/deleteme.md")).toBe(true);
  });
});

describe("other tests", () => {
  it("can combine async inside another methods", async () => {
    expect(await list(tmp("demo/x"))).toEqual([]);
  });

  it("can walk and filter and map", async () => {
    const files = await walk("demo")
      .filter((file) => /readme\.md$/.test(file))
      .map(read);

    expect(files).toContain("# Sub-sub-level\n");
  });
});
