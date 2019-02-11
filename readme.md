# 📁 Files [![npm install files](https://img.shields.io/badge/npm%20install-files-blue.svg)](https://www.npmjs.com/package/files)

Node.js filesystem API easily usable with Promises and arrays:

```js
const { read, walk } = require('files');

// Find all of the readmes
const readmes = await walk('demo')
  .filter(/\/readme\.md$/)
  .map(read);

console.log(readmes);
// ['# files', '# sub-dir', ...]
```

Files is a better `fs` filesystem:

- Works with **`'utf-8'`** by default.
- Uses **Promises** and works as expected with async/await.
- Exteds promises [with `swear`](https://github.com/franciscop/swear) so you can chain operations easily.
- **Absolute paths** with the root as the running script.
- Ignores **the second parameter** if it's not an object so you can work with arrays better like `.map(read)`.



## Documentation

|function            |description                                             |
|--------------------|--------------------------------------------------------|
|[abs()](#abs)       |retrieve the absolute path of the path                  |
|[cat()](#cat)*      |*alias* of [`read()`](#read)                            |
|[dir()](#dir)       |get the directory of the path                           |
|[exists()](#exists) |check whenever a file or folder exists                  |
|[home()](#home)     |get the home directory                                  |
|[join()](#join)     |put several path parts together in a cross-browser way  |
|[list()](#list)     |list all of the files and folders of the path           |
|[ls()](#list)*      |*alias* of [`.list()`](#list)                           |
|[mkdir()](#mkdir)   |create the specified directory                          |
|[name()](#name)     |get the filename of the path                            |
|[read()](#read)     |read the file from the specified path                   |
|[remove()](#remove) |remove a file or folder (recursively)                   |
|[stat()](#stat)     |get some information about the current file             |
|[tmp()](#tmp)       |find the temporary directory or a folder inside         |
|[walk()](#walk)     |recursively list all of the files and folders           |
|[write()](#write)   |create a new file or put data into a file               |

\*Alias of another method



### Swear

Any method that specifies an output of `:Promise(type)`, it will be following [`swear` specification](https://github.com/franciscop/swear) promise extension. These are fully compatible with native promises:

```js
const all = await list('demo');
const files = all.filter(file => !/node_modules/.test(file));
// ['a.js', 'b.js', ...] (all of the files and folders except node_modules)
```

Or with the swear workflow, you can use it as the type inside `:Promise(type)`, and then `await` for the final value:

```js
const files = await list(__dirname).filter(file => !/node_modules/.test(file));
// ['a.js', 'b.js', ...] (all of the files and folders except node_modules)
```

See how we applied the `.filter()` straight into the output of `list(__dirname)`. Then we have to await for the whole thing to resolve since `list()` is async. If this seems a bit confusing, read along the examples and try it yourself.



### abs()

```js
abs(path:string, root=process.cwd():string) => :string
```

Retrieve the absolute path of the passed argument relative of the directory running the script:

```js
// cd ~/me/projects/files/ && node index.js

console.log(abs('demo'));
// /home/me/projects/files/demo

console.log(abs('../../Documents'));
// /home/me/Documents
```

It will return the same string if the path is already absolute.

You can pass a second parameter to specify any base directory different from the executing environment:

```js
// cd ~/me/projects/files && node ./demo/abs.js

// default; Relative to the place where the script is run
console.log(abs('demo'));
// /home/me/projects/files/demo

// default; relative to the console location where the script is run
console.log(abs('demo', process.cwd()));
// /home/me/projects/files/demo

// relative to the current directory (./demo)
console.log(abs('demo', __dirname));
// /home/me/projects/files/demo/demo

// relative to the user's home directory https://stackoverflow.com/q/9080085
console.log(abs('demo', require('os').homedir()));
// /home/me/demo
```

If the second parameter is undefined, or if it's *not a string*, it will be completely ignored and the default of the current running dir will be used. This is great for looping on arrays or similar:

```js
console.log(['a', 'b'].map(abs));
// [ '/home/me/projects/files/a', '/home/me/projects/files/b' ]
```



### cat()

> *alias* of [`read()`](#read).



### dir()

```js
dir(path:string) => :string
```

Get the directory of the passed path:

```js
console.log(name('~/hello/world.js'));
// /home/me/hello
```



### exists()

```js
exists(path:string) => :Promise(:boolean)
```

Check whenever a file or folder exists:

```js
console.log(await exists('readme.md'));
// true

console.log(await exists('non-existing.md'));
// false
```

This *cannot* (yet) be used with `.filter()`, since `.filter()` is sync and doesn't expect an array of promises to be returned.

To filter based on whether it exists or not, extend it to an array of promises, then filter that asynchronously and finally retrieve the original file:

```js
const keeper = file => exists(file).then(keep => keep && file);
console.log(await ['a.md', 'b.md'].map(keeper).filter(file => file));
```



### home()

```js
home(arg1:string, arg2:string, ...) => Promise(:string)
```

Find the home directory if called without arguments, or the specified directory inside the home folder as specified in the arguments.

```js
console.log(await home());
// /home/me/

console.log(await home('demo'));
// /home/me/demo/

console.log(await home('demo', 'a'));
// /home/me/demo/a/
```

It will create the specified folder if it does not exist yet.

To make sure the new folder is empty, you can call `remove()` and `mkdir()` consecutively:

```js
const dir = await home('demo').then(remove).then(mkdir);
console.log(dir);
// /home/me/demo/ (empty)
```



### join()

```js
join(arg1:string, arg2:string, ...) => :string
```

Put several path segments together in a cross-browser way and return the absolute path:

```js
console.log(join('demo', 'a'));
// /home/me/projects/files/demo/a
```



### list()

```js
list(path=process.cwd():string) => :Promise(:Array(:string))
```

Get all of the files and folders of the specified directory into an array:

```js
console.log(await list());
// ['/home/me/files/node_modules', '/home/me/files/demo/abs.js', ...]
```

To scan any other directory specify it as a parameter:

```js
console.log(await list('demo'));
// ['/home/me/files/demo/a', '/home/me/files/demo/abs.js', ...]
```

> **Swear interface**: you can iterate and treat the returned value as a normal array, except that you'll have to `await` at some point for the whole thing.

```js
// Retrieve all of the files, filter for javascript and get their absolute paths
console.log(await list().filter(file => /\.js$/.test(file)).map(abs));
//  ['/home/me/projects/files/files.js', '/home/me/projects/files/files.test.js', ...]
```

Related methods:

- [`walk()`](#walk) recursively list all of the files in a directory. Does not output directories.



### ls()

*alias* of [`.list()`](#list)



### mkdir()

```js
mkdir(path:string) => :Promise(:string)
```

Create the specified directory. If it already exists, do nothing. Returns the directory that was created.

```js
// cd ~/projects/files && node index.js

console.log(await mkdir('demo/b'));
// /home/me/files/demo/b
```

Related methods:

- [exists()](#exists): check whether a directory exists.
- [remove()](#remove): remove a folder or file.
- [list()](#list): read all the contents of a directory.



### name()

```js
name(path:string) => :string
```

Get the filename of the passed path:

```js
console.log(name('~/hello/world.js'));
// world.js
```



### read()

```js
read(path:string) => :Promise(:string)
```

Read the specified file contents into a string:

```js
console.log(await read('readme.md'));
// # files ...
```

File reads are relative as always to the executing script. It expects a single argument so you can easily put an array on it:

```js
// Read two files manually
console.log(await ['a.md', 'b.md'].map(read));
// ['# A', '# B']

// Read all markdown files in all subfolders
console.log(await walk().filter(file => /\.md/.test(file)).map(read));
// ['# A', '# B', ...]
```

It also follows the `swear` specification, so you can perform any normal string operations on it:

```js
// Find all the secondary headers in a markdown file
console.log(await read('readme.md').split('\n').filter(l => /^##\s+/.test(l)));
// ['## cat()', '## dir()', ...]
```



### remove()

```js
remove(path:string) => :Promise(:string)
```


Remove a file or folder (recursively) and return the absolute path that was removed

```js
console.log(await remove('readme.md'));
// /home/me/projects/readme.md

console.log(await remove('~/old-project'));
// /home/me/old-project
```



### stat()

```js
stat(path:string) => :Promise(:object)
```

Get some information about the current path:

```js
console.log(await stat().isDirectory());
// true (the current directory)

console.log(await stat('readme.md').isFile());
// true

console.log(await stat('readme.md').atime);
// 2018-08-27T23:42:16.206Z
```



### tmp()

```js
tmp(arg1:string, arg2:string, ...) => Promise(:string)
```

Find the temporary directory. If arguments are passed, find the specified directory inside the tmp folder:

```js
console.log(await tmp());
// /tmp/

console.log(await tmp('demo'));
// /tmp/demo/

console.log(await tmp('demo', 'a'));
// /tmp/demo/a/
```

It will create the specified folder if it does not exist yet.

To make sure the new folder is empty, you can call `remove()` and `mkdir()` consecutively:

```js
const dir = await tmp('demo').then(remove).then(mkdir);
console.log(dir);
// /tmp/demo/ (empty)
```



### walk()

```js
walk(path:string) => :Promise(:Array(:string))
```

Recursively list all of the files from the specified folder:

```js
// Retrieve all files inside './demo'
console.log(await walk('demo'));
// ['/home/me/projects/files/demo/readme.md', '/home/me/projects/files/demo/a/readme.md', ...]
```

It will *not* return directories. You can then use `filter` to filter e.g. by filename:

```js
// Retrieve the content of all markdown files inside demo
console.log(await walk('demo').filter(file => /\.md$/.test(file)).map(read));
// ['# Readme A', '# Me also', ...]
```



### write()

```js
write(path:string, content:string) => :Promise(:string)
```

Create a new file or put data into a file that already exists. Returns the path of the file:

```js
// Write to a file and then read its contents
console.log(await write('demo.txt', 'Hello!').then(read));
// 'Hello!'
```
