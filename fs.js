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
const abs = (name = '.', base = process.cwd()) => {

  // Absolute paths do not need more absolutism
  if (path.isAbsolute(name)) return name;

  // We are off-base here; recover the viable base option
  if (!base || typeof base !== 'string') {
    base = process.cwd();
  }

  // Return the file/folder within the base
  return join(base, name);
};



// Read the contents of a single file
const cat = name => {
  const file = abs(name);
  const readFile = promisify(fs.readFile);
  return magic(readFile(file, 'utf-8'));
};



// Get the directory from path
const dir = name => path.dirname(abs(name));



// Check whether a filename exists or not
const exists = name => {
  const file = abs(name);
  const exists = promisify(fs.exists);
  return magic(exists(file).catch(res => res));
};



// Get the home directory: https://stackoverflow.com/a/9081436/938236
const home = (...args) => mkdir(join(homedir(), ...args));



// Put several path segments together
const join = (...args) => abs(path.join(...args));



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
const mkdir = name => {
  const file = abs(name);
  const realmkdir = promisify(fs.mkdir);

  return magic(file.split(path.sep).map((part, i, all) => {
    return all.slice(0, i + 1).join(path.sep);
  }).filter(Boolean).reduce((prom, path) => {
    return prom.then(async () => await exists(path) ? path : realmkdir(path))
      .catch(err => {}).then(() => file);
  }, Promise.resolve()));
};



// Get the path's filename
const name = path.basename;



// Delete a file or directory (recursively)
const remove = name => magic([abs(name)]).map(async file => {
  if (file === '/') throw new Error('Cannot remove the root folder `/`');
  if (!await exists(file)) return file;
  const stats = await stat(file);

  if (stats && stats.isDirectory()) {
    const files = await walk(file).map(remove);
    await list(file).map(remove);
    await promisify(fs.rmdir)(file).catch(err => {});
    return file;
  }
  await promisify(fs.unlink)(file).catch(err => {});
  return file;
})[0];



// Get some interesting info from the path
const stat = name => {
  const file = abs(name);
  const lstat = promisify(fs.lstat);
  return magic(lstat(file)).catch(err => {});
};



// Get a temporary folder
const tmp = (...args) => mkdir(join(tmpdir(), ...args));



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
const walk = name => magic(exists(abs(name)).then(isThere => {
  if (!isThere) return magic([]);
  if (linux() || mac()) {
    return run(`find ${abs(name)} -type f`).split('\n').filter(Boolean);
  }
  return rWalk(abs(name)).filter(Boolean);
}));



// Create a new file with the specified contents
const write = (name, body = '') => {
  const file = abs(name);
  const writeFile = promisify(fs.writeFile);
  return magic(writeFile(file, body, 'utf-8').then(() => file));
};



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
