# File System Promises

Node.js filesystem API easily usable with Promises and arrays. It does:

- absolute paths with the root as the running script.
- `'utf-8'` and strings. Won't return Buffers.
- `Promises` through the [`magic-promises`](#magic-promises) interface.

Example: find the content of all `readme.md` in the directory and sub-dirs:

```js
const { read, walk } = require('fs-array');

const files = await walk('demo')
  .filter(name => /\/readme\.md$/.test(name))
  .map(read);

console.log(files);
// ['# fs-array', '# sub-dir', ...]
```


## Documentation

|function            |description                                             |
|--------------------|--------------------------------------------------------|
|[abs()](#abs)       |retrieve the absolute path of the path                  |
|[cat()](#cat)*      |*alias* of [`read()`](#read)                            |
|[dir()](#dir)       |get the directory of the path                           |
|[exists()](#exists) |check whenever a file or folder exists                  |
|[join()](#join)     |put several path parts together in a cross-browser way  |
|[list()](#list)     |list all of the files and folders of the path           |
|[ls()](#list)*      |*alias* of [`.list()`](#list)                           |
|[mkdir()](#mkdir)   |create the specified directory                          |
|[name()](#name)     |get the filename of the path                            |
|[read()](#read)     |read the file from the specified path                   |
|[remove()](#remove) |remove a file or folder (recursively)                   |
|[stat()](#stat)     |get some information about the current file             |
|[walk()](#walk)     |recursively list all of the files and folders           |
|[write()](#write)   |create a new file or put data into a file               |

\*Alias of another method



### Magic promises

Any method that specifies an output of `:Promise(type)`, it will be following [`magic-promises` specification](https://github.com/franciscop/magic-promises).

Magic Promises are fully compatible with native promises:

```js
const all = await list('demo');
const files = all.filter(file => !/node_modules/.test(file));
// ['a.js', 'b.js', ...] (all of the files and folders except node_modules)
```

Or with the magic-promises workflow, you can use it as the type inside `:Promise(type)`, and then `await` for the final value:

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
// cd ~/me/projects/fs/ && node index.js

console.log(abs('demo'));
// /home/me/projects/fs/demo

console.log(abs('../../Documents'));
// /home/me/Documents
```

It will return the same string if the path is already absolute.

You can pass a second parameter to specify any base directory different from the executing environment:

```js
// cd ~/me/projects/fs && node ./demo/abs.js

// default; Relative to the place where the script is run
console.log(abs('demo'));
// /home/me/projects/fs/demo

// default; relative to the console location where the script is run
console.log(abs('demo', process.cwd()));
// /home/me/projects/fs/demo

// relative to the current directory (./demo)
console.log(abs('demo', __dirname));
// /home/me/projects/fs/demo/demo

// relative to the user's home directory https://stackoverflow.com/q/9080085
console.log(abs('demo', require('os').homedir()));
// /home/me/demo
```

If the second parameter is undefined, or if it's *not a string*, it will be completely ignored and the default of the current running dir will be used. This is great for looping on arrays or similar:

```js
console.log(['a', 'b'].map(abs));
// [ '/home/me/projects/fs/a', '/home/me/projects/fs/b' ]
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



### join()

```js
join(arg1:string, arg2:string, ...) => :string
```

Put several path segments together in a cross-browser way and return the absolute path:

```js
console.log(join('demo', 'a'));
// /home/me/projects/fs/demo/a
```



### list()

```js
list(path=process.cwd():string) => :Promise(:Array(:string))
```

Get all of the files and folders of the specified directory into an array:

```js
console.log(await list());
// ['/home/me/fs/node_modules', '/home/me/fs/demo/abs.js', ...]
```

To scan any other directory specify it as a parameter:

```js
console.log(await list('demo'));
// ['/home/me/fs/demo/a', '/home/me/fs/demo/abs.js', ...]
```

> **Magic Promises**: you can iterate and treat the returned value as a normal array, except that you'll have to `await` at some point for the whole thing.

```js
// Retrieve all of the files, filter for javascript and get their absolute paths
console.log(await list().filter(file => /\.js$/.test(file)).map(abs));
//  ['/home/me/projects/fs/fs.js', '/home/me/projects/fs/fs.test.js', ...]
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
// cd ~/projects/fs && node index.js

console.log(await mkdir('demo/b'));
// /home/me/fs/demo/b
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
// # fs-array ...
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

It also follows the `magic-promises` specification, so you can perform any normal string operations on it:

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



### walk()

```js
walk(path:string) => :Promise(:Array(:string))
```

Recursively list all of the files from the specified folder:

```js
// Retrieve all files inside './demo'
console.log(await walk('demo'));
// ['/home/me/projects/fs/demo/readme.md', '/home/me/projects/fs/demo/a/readme.md', ...]
```

It will *not* return directories. You can then use `filter` to filter e.g. by filename:

```js
// Retrieve the content of all markdown files inside demo
console.log(await walk('demo').filter(file => /\.md$/.test(file)).map(read));
// ['# Readme A', '# Me also', ...]
```



### write()

```js
write(path:string, content:string) => :Promise(:object)
```

Create a new file or put data into a file that already exists. Returns the path of the file:

```js
// Write to a file and then read its contents
console.log(await write('demo.txt', 'Hello!').then(read));
// 'Hello!'
```
