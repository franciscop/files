import files, {
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
  stat,
  swear,
  tmp,
  walk,
  write,
} from ".";

async function test() {
  await abs();
  await abs("readme.md");
  await abs("readme.md", "base/path/");
  await copy("file1.md", "file2.md");
  await dir();
  await dir("readme.md");
  await exists("readme.md");
  await home();
  await home("abc");
  await home("abc", "def");
  await join();
  await join("abc");
  await join("a", "b", "c");
  await list();
  await list("demo");
  await mkdir();
  await mkdir("hello");
  await move("src", "dst");
  await name("hello");
  await read("file");
  await remove();
  await remove("folder");
  await rename("src", "dst");
  await stat("file");
  await swear(async () => "abc");
  await swear(Promise.resolve("abc"));
  await tmp();
  await tmp("abc");
  await tmp("abc", "def");
  await walk();
  await walk("abc");
  await write("./readme.md", "hello");
  await write("./readme.md", { hello: "world" });
  await write("./readme.md", Buffer.from("Hello", "utf8"));
}

async function testBase() {
  await files.abs();
  await files.abs("readme.md");
  await files.abs("readme.md", "base/path/");
  await files.copy("file1.md", "file2.md");
  await files.dir();
  await files.dir("readme.md");
  await files.exists("readme.md");
  await files.home();
  await files.home("abc");
  await files.home("abc", "def");
  await files.join();
  await files.join("abc");
  await files.join("a", "b", "c");
  await files.list();
  await files.list("demo");
  await files.mkdir();
  await files.mkdir("hello");
  await files.move("src", "dst");
  await files.name("hello");
  await files.read("file");
  await files.remove();
  await files.remove("folder");
  await files.rename("src", "dst");
  await files.stat("file");
  await files.swear(async () => "abc");
  await files.swear(Promise.resolve("abc"));
  await files.tmp();
  await files.tmp("abc");
  await files.tmp("abc", "def");
  await files.walk();
  await files.walk("abc");
  await files.write("./readme.md", "hello");
  await files.write("./readme.md", { hello: "world" });
  await files.write("./readme.md", Buffer.from("Hello", "utf8"));
}

console.log(test, testBase);
