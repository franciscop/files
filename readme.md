# File System Promises

Awesome filesystem API designed to be easily usable with arrays and promises. It does:

- absolute paths with the root as the running script.
- `'utf-8'` and strings. Won't return Buffers.
- `Promises` through the [`magic-promises`](#magic-promises) interface.

Example: find the content of all `readme.md` in the directory and sub-dirs:

```js
const { readFile, walk } = require('fs-array');
const files = await walk('demo')
  .filter(name => /\/readme\.md$/.test(name))
  .map(readFile);

console.log(files);
// ['# fs-array', '# sub-dir', ...]
```


## Documentation

|function             |description                                             |
|---------------------|--------------------------------------------------------|
|[abs()](#abs)       |retrieve the absolute path of the path                  |
|[cat()](#cat)       |read the file from the specified path                   |
|[exists()](#exists) |check whenever a file or folder exists                  |
|[join()](#join)     |cross-browser way to put two path fragments together    |
|[list()](#list)     |list all of the files and folders of the path           |
|[ls()](#list)*      |*alias* of `.list()`                                    |
|[mkdir()](#mkdir)   |create the specified directory                          |
|[name()](#name)     |get the filename of the path                            |
|[remove()](#remove) |remove a file or folder (recursively)                   |
|[readFile()](#cat)* |*alias* of `.cat()`                                     |
|[stat()](#stat)     |get some information about the current file             |
|[walk()](#walk)     |recursively list all of the files and folders           |
|[write()](#write)   |create a new file or put data into a file               |

\*Alias of another method

Any method that specifies an output of `:Promise(type)`, it will be following [`magic-promises` specification](https://github.com/franciscop/magic-promises).

You can use it as normal promises:

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
// cd /home/me/projects/fs/ && node index.js

console.log(abs('demo'));
// /home/me/projects/fs/demo

console.log(abs('../../Documents'));
// /home/me/Documents
```

It will return the same string if the path is already absolute.

You can pass a second parameter to specify any base directory different from the executing environment:

```js
// cd /home/me/projects/fs && node ./demo/abs.js

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
// cd /home/me/projects/fs && node ./demo/abs.js   #<= notice './demo'

console.log(['a', 'b'].map(abs));
// [ '/home/me/projects/fs/a', '/home/me/projects/fs/b' ]
```



### cat()

```js
cat(file:string) => :Promise(:string)
```

Read file's contents




### exists()

Check whenever a file or folder exists



### join()

```js
join(arg1:string, arg2:string, ...) => :string
```

Put several path segments together in a cross-browser way and return the absolute path:

```js
console.log(join('demo', 'a'));
// /home/francisco/projects/fs/demo/a
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

Create the specified directory



### name()

Get the filename of the path



### remove()

Remove a file or folder (recursively)



### readFile()

*alias* of [`.cat()`](#cat)



### stat()

Get some information about the current file



### walk()

Recursively list all of the files and folders



### write()

Create a new file or put data into a file
