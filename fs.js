// The best filesystem for promises and array manipulation
const fs = require('fs');
const path = require('path');
const { homedir, tmpdir } = require('os');
const { promisify } = require('util');
const magic = require('magic-promises');
const run = require('atocha');



// Find whether it's Linux or Mac, where we can use `find`
const mac = () => process.platform === 'darwin';
const linux = () => process.platform === 'linux';



// Retrieve the full, absolute path for the path
const abs = (name = '.', base = process.cwd()) => magic((async () => {
  name = await name;
  base = await base;

  // Absolute paths do not need more absolutism
  if (path.isAbsolute(name)) return name;

  // We are off-base here; recover the viable base option
  if (!base || typeof base !== 'string') {
    base = process.cwd();
  }

  // Return the file/folder within the base
  return join(base, name);
})());



// Read the contents of a single file
const readFile = file => promisify(fs.readFile)(file, 'utf-8');
const cat = name => magic(abs(name).then(readFile).catch(err => ''));



// Get the directory from path
const dirFlat = file => path.dirname(file);
const dir = name => magic(abs(name).then(dirFlat));



// Check whether a filename exists or not
const existsAsync = promisify(fs.exists);
const existsFlat = file => existsAsync(file);
// Need to catch since for some reason, sometimes promisify() will not work
//   properly and will return the first boolean arg of exists() as an error
const exists = name => magic(abs(name).then(existsFlat).catch(res => res));



// Get the home directory: https://stackoverflow.com/a/9081436/938236
const home = (...args) => magic(join(homedir(), ...args).then(mkdir));



// Put several path segments together
const joinFlat = parts => path.join(...parts);
const join = (...parts) => abs(magic(parts).then(joinFlat));



// List all the files in the folder
const list = dir => {
  const readDir = promisify(fs.readdir);

  // Map it to make all of the paths absolute
  return magic([dir])
    .map(abs)
    .map(file => readDir(file))
    .shift()
    .map(file => abs(file, dir));
};



// Create a new directory in the specified path
const mkdirAsync = promisify(fs.mkdir);
const mkdir = name => magic(abs(name).then(async file => {
  return magic(file.split(path.sep).map((part, i, all) => {
    return all.slice(0, i + 1).join(path.sep);
  }).filter(Boolean).reduce((prom, path) => {
    return prom.then(async () => await exists(path) ? path : mkdirAsync(path))
      .catch(err => {}).then(() => file);
  }, Promise.resolve()));
}));

// const mkdir = name => {
//   const file = abs(name);
//   const realmkdir = promisify(fs.mkdir);
//
//   return magic(file.split(path.sep).map((part, i, all) => {
//     return all.slice(0, i + 1).join(path.sep);
//   }).filter(Boolean).reduce((prom, path) => {
//     return prom.then(async () => await exists(path) ? path : realmkdir(path))
//       .catch(err => {}).then(() => file);
//   }, Promise.resolve()));
// };



// Get the path's filename
const nameFlat = path.basename;
const name = file => magic(magic(file).then(nameFlat));



// Delete a file or directory (recursively)
const removeDirAsync = promisify(fs.rmdir);
const removeFileAsync = promisify(fs.unlink);
const remove = name => magic(abs(name).then(async file => {
  if (file === '/') throw new Error('Cannot remove the root folder `/`');
  if (!await exists(file)) return file;

  if (await stat(file).isDirectory()) {
    const files = await walk(file).map(remove);
    await list(file).map(remove);
    await removeDirAsync(file).catch(err => {});
    return file;
  }
  await removeFileAsync(file).catch(err => {});
  return file;
}));



// Get some interesting info from the path
const statAsync = promisify(fs.lstat);
const stat = name => magic(abs(name).then(statAsync).catch(err => {}));



// Get a temporary folder
const tmp = (...args) => abs(join(tmpdir(), ...args).then(mkdir));



// Perform a recursive walk
const rWalk = name => {
  const file = abs(name);

  const deepper = async file => {
    if ((await stat(file)).isDirectory()) {
      return rWalk(file);
    }
    return [file];
  };

  // Note: list() already wraps the promise
  return list(file).map(deepper).reduce((all, arr) => all.concat(arr), []);
};

// Attempt to make an OS walk, and fallback to the recursive one
// const walk = name => magic();

const walk = name => magic(exists(name).then(async isThere => {
  if (!isThere) return magic([]);
  if (linux() || mac()) {
    return run(`find ${await abs(name)} -type f`).split('\n').filter(Boolean);
  }
  return rWalk(abs(name)).filter(Boolean);
}));



// Create a new file with the specified contents
const writeAsync = promisify(fs.writeFile);
const writeFlat = (file, body) => writeAsync(file, body, 'utf-8');
const write = (name, body = '') => magic(abs(name).then(async file => {
  await writeAsync(file, body);
  return file;
}));



export {
  abs,
  cat,
  dir,
  exists,
  home,
  join,
  list,
  list as ls,
  mkdir,
  name,
  cat as read,
  remove,
  stat,
  tmp,
  walk,
  write
};
