# 📁 Files [![npm install files](https://img.shields.io/badge/npm%20install-files-blue.svg)](https://www.npmjs.com/package/files) [![test badge](https://github.com/franciscop/files/workflows/tests/badge.svg)](https://github.com/franciscop/files/actions)

A flexible filesystem API for Node and Bun:

```js
import { read, walk } from "files";

// Find all of the readmes
const readmes = await walk("demo")
  .filter(/\/readme\.md$/) // Works as expected!
  .map(read);

console.log(readmes);
// ['# files', '# sub-dir', ...]
```

- Works with **`'utf-8'`** by default.
- Supports **Promises**, **WebStreams**, **NodeStreams** (and Buffers and JSON).
- Extends promises [with `swear`](https://github.com/franciscop/swear) so you can chain operations easily.
- **Absolute paths** with the root as the running script.
- Ignores **the second parameter** if it's not an object so you can work with arrays better like `.map(read)`.

It's an ideal library if you have to build scripts with many file and folder operations since it's made to simplify those.

| function            | description                                            |
| ------------------- | ------------------------------------------------------ |
| [abs()](#abs)       | retrieve the absolute path of the path                 |
| [copy()](#copy)     | copy a file while keeping the original                 |
| [dir()](#dir)       | get the directory of the path                          |
| [exists()](#exists) | check whenever a file or folder exists                 |
| [home()](#home)     | get the home directory                                 |
| [join()](#join)     | put several path parts together in a cross-browser way |
| [list()](#list)     | list all of the files and folders of the path          |
| [mkdir()](#mkdir)   | create the specified directory                         |
| [move()](#move)     | copy a file while removing the original                |
| [name()](#name)     | get the filename of the path                           |
| [read()](#read)     | read the file from the specified path                  |
| [remove()](#remove) | remove a file or folder (recursively)                  |
| [rename()](#rename) | _alias_ of [`.move()`](#move)                          |
| [stat()](#stat)     | get some information about the current file            |
| [swear()](#swear)   | the promise wrapper that we use internally             |
| [tmp()](#tmp)       | find the temporary directory or a folder inside        |
| [walk()](#walk)     | recursively list all of the files and folders          |
| [write()](#write)   | create a new file or put data into a file              |

## Swear package

All of the methods [follow the `swear`](https://github.com/franciscop/swear) promise extension. These are fully compatible with native promises:

```js
// Using it as normal promises
const all = await list("demo");
const devFiles = all.filter((file) => !/node_modules/.test(file));
// ['a.js', 'b.js', ...]
```

With the swear workflow, you can apply operations on the promise that will be queued and run on the eventual value:

```js
const devFiles = await list("demo").filter(
  (file) => !/node_modules/.test(file)
);
// ['a.js', 'b.js', ...]
```

See how we applied the `.filter()` straight into the output of `list()`. Then we have to await for the whole thing to resolve since `list()` is async. If this seems a bit confusing, read along the examples and try it yourself.

For convenience, you can import and use `swear`:

```js
import files, { swear } from "files";

files.swear();
swear();
```

## abs()

```js
abs(path:string, root=process.cwd():string) => :string
```

Retrieve the absolute path of the passed argument relative of the directory running the script:

```js
// cd ~/me/projects/files/ && node index.js

console.log(await abs("demo"));
// /home/me/projects/files/demo

console.log(await abs("../../Documents"));
// /home/me/Documents
```

It will return the same string if the path is already absolute.

You can pass a second parameter to specify any base directory different from the executing environment:

```jsx
// cd ~/me/projects/files && node ./demo/abs.js ⚠️

// default; Relative to the place where the script is run
console.log(await abs("demo"));
// /home/me/projects/files/demo

// default; relative to the console location where the script is run
console.log(await abs("demo", process.cwd()));
// /home/me/projects/files/demo

// relative to the current directory (./demo)
console.log(await abs("demo", import.meta.url));
// /home/me/projects/files/demo/demo
```

If the second parameter is undefined, or if it's _not a string_, it will be completely ignored and the default of the current running dir will be used. This is great for looping on arrays or similar:

```js
console.log(await list("demo").map(abs));
// [ '/home/me/projects/files/a', '/home/me/projects/files/b' ]
```

## copy()

```js
copy(source:string, destination:string) => :string
```

Copy the source file into the destination file, which can be in the same folder or in any other. It maintains the original. Returns the resulting file:

```js
// cd ~/projects/files && node index.js

console.log(await copy("demo/README.md", "demo/readme.md"));
// /home/me/files/demo/readme.md

console.log(await copy("demo/readme.md", "demo/docs/readme.md"));
// /home/me/files/demo/docs/readme.md
```

Related methods:

- [move()](#move): copy a file while removing the original

## dir()

```js
dir(path:string) => :string
```

Returns the directory of the passed path:

```js
console.log(await dir("~/hello/world.js"));
// /home/me/hello
```

If the path is already a directory, it returns the one that contains it; its parent:

```js
console.log(await dir("~/hello/"));
// /home/me
```

## exists()

```js
exists(path:string) => :boolean
```

Check whenever a file or folder exists:

```js
console.log(await exists("readme.md"));
// true

console.log(await exists("non-existing.md"));
// false
```

This _cannot_ be used with `.filter()`, since in JS `.filter()` is sync and doesn't expect an array of promises to be returned.

To filter based on whether it exists or not, extend it to an array of promises, then filter that asynchronously and finally retrieve the original file:

```js
const keeper = (file) => exists(file).then((keep) => keep && file);
const existing = await Promise.all(["a.md", "b.md"].map(keeper));
console.log(existing.filter((file) => file));
```

> **Swear interface**: you can use `swear` to make your life a bit easier with its `.filter()`, which accepts promises:

```js
import { swear } from "files";
console.log(await swear(["a.md", "b.md"]).filter(exists));
```

## home()

```js
home(arg1:string, arg2:string, ...) => :string
```

Find the home directory if called without arguments, or the specified directory inside the home folder as specified in the arguments.

```js
console.log(await home());
// /home/me/

console.log(await home("demo"));
// /home/me/demo/

console.log(await home("demo", "a"));
// /home/me/demo/a/
```

It will create the specified folder if it does not exist yet.

To make sure the new folder is empty, you can call `remove()` and `mkdir()` consecutively:

```js
const dir = await home("demo").then(remove).then(mkdir);
console.log(dir);
// /home/me/demo/ (empty)
```

## join()

```js
join(arg1:string, arg2:string, ...) => :string
```

Put several path segments together in a cross-browser way and return the absolute path:

```js
console.log(await join("demo", "a"));
// /home/me/projects/files/demo/a
```

## list()

```js
list(path=process.cwd():string) => :Array(:string)
```

Get all of the files and folders of the specified directory into an array:

```js
console.log(await list());
// ['/home/me/files/node_modules', '/home/me/files/demo/abs.js', ...]
```

To scan any other directory specify it as a parameter:

```js
console.log(await list("demo"));
// ['/home/me/files/demo/a', '/home/me/files/demo/abs.js', ...]
```

> **Swear interface**: you can iterate and treat the returned value as a normal array, except that you'll have to `await` at some point for the whole thing.

```js
// Retrieve all of the files and filter for javascript
console.log(await list().filter(/\.js$/));
//  ['/home/me/projects/files/files.js', '/home/me/projects/files/files.test.js', ...]
```

Related methods:

- [`walk()`](#walk) recursively list all of the files in a directory. Does not output directories.

## mkdir()

```js
mkdir(path:string) => :string
```

Create the specified directory. If it already exists, do nothing. Returns the directory that was created.

```js
// cd ~/projects/files && node index.js

console.log(await mkdir("demo/b"));
// /home/me/files/demo/b
```

Related methods:

- [exists()](#exists): check whether a directory exists.
- [remove()](#remove): remove a folder or file.
- [list()](#list): read all the contents of a directory.

## move()

```js
move(source:string, destination:string) => :string
```

Put the source file into the destination file. This can be just a rename or actually changing the folder where the file lives. Returns the resulting file:

```js
// cd ~/projects/files && node index.js

console.log(await move("demo/README.md", "demo/readme.md"));
// /home/me/files/demo/readme.md

console.log(await move("demo/readme.md", "demo/docs/readme.md"));
// /home/me/files/demo/docs/readme.md
```

Related methods:

- [copy()](#copy): copy a file while keeping the original

## name()

```js
name(path:string) => :string
```

Get the filename of the passed path:

```js
console.log(await name("~/hello/world.js"));
// world.js
```

## read()

```js
read(path:string, { type: 'string' }) => :string
```

Read the specified file contents into a string:

```js
console.log(await read("readme.md"));
// # files ...

console.log(await read("data.json").then(JSON.parse));
// { hello: "world" }
```

You can specify other types: `raw`, `json`, `web` (WebStream) and `node` (NodeStreams):

```js
console.log(await read("data.json", { type: 'json' });
// { hello: "world" }

const stream = await read("data.json", { type: 'web' });
stream.pipeTo(...);
```

File reads are relative as always to the executing script. It expects a single argument so you can easily put an array on it:

```js
// Read two files manually
console.log(await Promise.all(["a.md", "b.md"].map(read)));
// ['# A', '# B']

// Read all markdown files in all subfolders (using Swear interface):
console.log(await walk("demo").filter(/\.md$/).map(read));
// ['# A', '# B', ...]
```

It also follows the [`swear` specification](#swear-package), so you can chain normal string operations on it:

```js
// Find all the secondary headers in a markdown file
console.log(await read('readme.md').split('\n').filter(/^##\s+/));
// ['## abs()', '## dir()', ...]

// Read all markdown files in all subfolders
console.log(await walk().filter(/\.md$/).map(read)));
// ['# A', '# B', ...]
```

## remove()

```js
remove(path:string) => :string
```

Remove a file or folder (recursively) and return the absolute path that was removed

```js
console.log(await remove("readme.md"));
// /home/me/projects/readme.md

console.log(await remove("~/old-project"));
// /home/me/old-project
```

Please be careful when using this, since there is no way of recovering deleted files.

## rename()

> _alias_ of [`move()`](#move).

## stat()

```ts
stat(path:string) => :Object({
  isDirectory:fn,
  isFile:fn,
  atime:string,
  mtime:string,
  ...
})
```

Get some information about the current path:

```js
console.log(await stat().isDirectory());
// true (the current directory)

console.log(await stat("readme.md").isFile());
// true

console.log(await stat("readme.md").atime);
// 2018-08-27T23:42:16.206Z
```

## swear()

```js
swear(arg:any) => :any
```

This [is **the `swear` package**](https://www.npmjs.com/package/swear) exported here for convenience. It allows you to chain promises using the underlying value methods for convenience.

Example: reading some specific files if they exist **without** swear:

```js
const keeper = (file) => exists(file).then((keep) => keep && file);
const existing = await Promise.all(["a.md", "b.md"].map(keeper));
console.log(existing.filter(Boolean).map(read));
```

Reading the same files if they exist **with** swear:

```js
console.log(await swear(["a.md", "b.md"]).filter(exists).map(read));
```

## tmp()

```js
tmp(arg1:string) => :string
```

Find the temporary directory. Find a subfolder if an argument is passed:

```js
console.log(await tmp());
// /tmp/

console.log(await tmp("demo"));
// /tmp/demo/

console.log(await tmp("demo", "a"));
// /tmp/demo/a/
```

It will create the specified folder if it does not exist yet.

To reuse a temp folder and make sure it's empty on each usage, you can call `remove()` and `mkdir()` consecutively:

```js
const dir = await tmp("demo").then(remove).then(mkdir);
console.log(dir);
// /tmp/demo/ (empty)
```

## walk()

```js
walk(path:string) => :Array(:string)
```

Recursively list all of the files from the specified folder:

```js
// Retrieve all files inside './demo'
console.log(await walk("demo"));
// ['/home/me/projects/files/demo/readme.md', '/home/me/projects/files/demo/a/readme.md', ...]
```

It will _not_ return directories. You can then use `filter` to filter e.g. by filename:

```js
// Retrieve the content of all markdown files inside demo
console.log(
  await walk("demo")
    .filter((file) => /\.md$/.test(file))
    .map(read)
);
// ['# Readme A', '# Me also', ...]
```

## write()

```js
write(path:string, content:any) => :string
```

Create a new file or put data into a file that already exists. Returns the path of the file:

```js
// Write to a file and then read its contents
console.log(await write("demo.txt", "Hello!").then(read));
// 'Hello!'
```

If the folder of the target file doesn't exist it will create it.

It accepts multiple types for the contect, specifically it accepts `string`, `Buffer`, `ReadableStream` (WebStreams) and `Readable` (NodeStreams) or a serializable object/array that will be converted to JSON.
