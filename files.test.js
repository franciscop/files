// fs-promises
import {
  abs,
  cat,
  dir,
  exists,
  home,
  join,
  list,
  ls,
  mkdir,
  name,
  remove,
  read,
  stat,
  tmp,
  walk,
  write
} from "./files";

// Native file system and path
import fs from "fs";
import path from "path";
import swear from "swear";
import cmd from "atocha";
import { promisify } from "util";

// Find whether it's Linux or Mac, where we can use `find`
const mac = () => process.platform === "darwin";
const linux = () => process.platform === "linux";

const root = linux() ? "/home/" : mac() ? "/Users/" : "C:\\projects";

const fake = async (obj, key, value, cb) => {
  const init = obj[key];
  Object.defineProperty(obj, key, { value, writable: true });
  try {
    return await cb();
  } finally {
    Object.defineProperty(obj, key, { value: init, writable: true });
  }
};

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
});

describe("cat", () => {
  it("can read a markdown file", async () => {
    expect(await cat("demo/readme.md")).toContain("# Hello!");
  });

  it("works with swear()", async () => {
    expect(await cat(swear("demo/readme.md"))).toContain("# Hello!");
  });

  it("is empty if it is not a file", async () => {
    expect(await cat(swear("demo"))).toBe("");
  });
});

describe("dir", () => {
  it("defaults to the current dir", async () => {
    expect(await dir()).toContain(root);
    expect(await dir()).toBe(await cmd('pwd').replace(/\/files\/?$/, ''));
    expect(await dir()).not.toContain("/files");
  });

  it("works with swear()", async () => {
    expect(await dir(swear("demo/a/b/readme.md"))).toContain("/files/demo/a/b");
  });

  it("can put the full folder path", async () => {
    expect(await dir("demo/a/b/readme.md")).toContain("/files/demo/a/b");
    expect(await dir(dir("demo/a/b/readme.md"))).not.toContain(
      "/files/demo/a/b"
    );
    expect(await dir(dir(dir("demo/a/b/readme.md")))).not.toContain(
      "/files/demo/a"
    );
  });

  it("can work with relative paths", async () => {
    expect(await dir("../")).toBe(
      await abs("../")
        .replace(/\/$/, "")
        .split("/")
        .slice(0, -1)
        .join("/")
    );
  });
});

describe("list", () => {
  it("defaults to the current folder", async () => {
    expect(await list()).toContain(__dirname + "/files.js");
  });

  it("works with swear()", async () => {
    expect(await list(swear(process.cwd()))).toContain(__dirname + "/files.js");
  });

  it("can load the demo", async () => {
    const files = await list("demo", __dirname);
    expect(files).not.toContain(__dirname + "/files.js");
    expect(files).toContain(__dirname + "/demo/a");
    expect(files).toContain(__dirname + "/demo/readme.md");
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
  it("uses the home directory", async () => {
    expect(await home()).toEqual(await cmd("echo $HOME"));
  });

  it("works with swear()", async () => {
    expect(await home(swear(""))).toContain(root);
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
    promisify(fs.rmdir)(await abs("demo/b")).catch(err => {})
  );
  afterEach(async () =>
    promisify(fs.rmdir)(await abs("demo/b")).catch(err => {})
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

describe("remove", () => {
  it("removes a file", async () => {
    await write("demo/remove.md", "Hello!");
    expect(await cat("demo/remove.md")).toBe("Hello!");
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
    expect(await cat("demo/b/remove.md")).toBe("Hello!");
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
    expect(await cat("demo/x/remove.md")).toBe("Hello!");
    expect(await exists("demo/x/c")).toBe(true);
    expect(await cat("demo/x/c/remove.md")).toBe("Hello!");
    const file = await remove("demo/x");
    expect(await exists("demo/x")).toBe(false);
    expect(file).toBe(await abs("demo/x"));
  });

  it("cannot remove the root", async () => {
    await expect(remove("/")).rejects.toThrow(/remove the root/);
  });

  it("will ignore a non-existing file", async () => {
    expect(await exists("demo/d")).toBe(false);
    await expect(await remove("demo/d")).toEqual(await abs("demo/d"));
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
    } else {
      expect(await tmp()).toBe("C:\\Users\\appveyor\\AppData\\Local\\Temp\\1");
    }
  });

  it("works with swear()", async () => {
    if (linux()) {
      expect(await tmp(swear("demo"))).toBe("/tmp/demo");
    } else if (mac()) {
      expect(await tmp("demo")).toBe((await cmd("echo $TMPDIR")) + "demo");
    } else {
      expect(await tmp("demo")).toBe(
        "C:\\Users\\appveyor\\AppData\\Local\\Temp\\1\\demo"
      );
    }
  });

  it("works with a path", async () => {
    if (linux()) {
      expect(await tmp("demo")).toBe("/tmp/demo");
    } else if (mac()) {
      expect(await tmp("demo")).toBe((await cmd("echo $TMPDIR")) + "demo");
    } else {
      expect(await tmp("demo")).toBe(
        "C:\\Users\\appveyor\\AppData\\Local\\Temp\\1\\demo"
      );
    }
  });

  it("can reset the doc", async () => {
    await tmp("demo").then(remove);
    expect(await tmp("demo").then(ls)).toEqual([]);
    mkdir(await tmp("demo/a"));
    if (linux()) {
      expect(await tmp("demo").then(ls)).toEqual(["/tmp/demo/a"]);
    } else if (mac()) {
      expect(await tmp("demo").then(ls)).toEqual([
        (await cmd("echo $TMPDIR")) + "demo/a"
      ]);
    } else {
      expect(await tmp("demo").then(ls)).toBe(
        "C:\\Users\\appveyor\\AppData\\Local\\Temp\\1\\demo\\a"
      );
    }
    await tmp("demo")
      .then(remove)
      .then(mkdir);
    expect(await tmp("demo").then(ls)).toEqual([]);
  });
});

describe("walk", () => {
  it("defaults to the current directory", async () => {
    expect(await walk()).toContain(__dirname + "/files.js");
  });

  it("works with swear()", async () => {
    expect(await walk(swear(process.cwd()))).toContain(__dirname + "/files.js");
  });

  it("is empty if it doesn not exist", async () => {
    expect(await walk("demo/c")).toEqual([]);
  });

  it("can deep walk", async () => {
    const files = await walk("demo");
    expect(files).toContain(__dirname + "/demo/readme.md");
    expect(files).toContain(__dirname + "/demo/a/readme.md");
    expect(files).toContain(__dirname + "/demo/a/b/readme.md");
  });

  it("can deep walk on Windows", async () => {
    return fake(process, "platform", "win32", async () => {
      const files = await walk("demo");
      expect(files).toContain(__dirname + "/demo/readme.md");
      expect(files).toContain(__dirname + "/demo/a/readme.md");
      expect(files).toContain(__dirname + "/demo/a/b/readme.md");
    });
  });

  it("can deep walk on Mac", async () => {
    return fake(process, "platform", "darwin", async () => {
      const files = await walk("demo");
      expect(files).toContain(__dirname + "/demo/readme.md");
      expect(files).toContain(__dirname + "/demo/a/readme.md");
      expect(files).toContain(__dirname + "/demo/a/b/readme.md");
    });
  });
});

describe("write", () => {
  beforeEach(async () =>
    promisify(fs.unlink)(await abs("demo/deleteme.md")).catch(err => {})
  );
  afterEach(async () =>
    promisify(fs.unlink)(await abs("demo/deleteme.md")).catch(err => {})
  );

  it("creates a new file", async () => {
    expect(await exists("demo/deleteme.md")).toBe(false);
    await write("demo/deleteme.md", "Hello!");
    expect(await cat("demo/deleteme.md")).toBe("Hello!");
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
    expect(await ls(tmp("demo/x"))).toEqual([]);
  });

  it("can walk and filter and map", async () => {
    const files = await walk("demo")
      .filter(file => /\/readme\.md$/.test(file))
      .map(read);

    expect(files).toContain("# Sub-sub-level\n");
  });
});
