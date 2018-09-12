// The best filesystem for promises and array manipulation
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const magic = require('magic-promises');



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



// Check whether a filename exists or not
const exists = name => {
  const file = abs(name);
  const exists = promisify(fs.exists);
  return magic(exists(file));
};



// Put several path segments together
const join = (...args) => abs(path.join(...args));



// List all the files in the folder
const list = name => {
  const file = abs(name);
  const readDir = promisify(fs.readdir);

  // Map it to make all of the paths absolute
  return magic(readDir(file)).map(name => join(file, name));
};



// Create a new directory in the specified path
const mkdir = name => {
  const file = abs(name);
  const realmkdir = promisify(fs.mkdir);

  // Make sure it doesn't fail
  return magic(realmkdir(file)).catch(err => {}).then(() => file);
};



// Get the path's filename
const name = path.basename;



// Delete a file or directory (recursively)
const remove = name => magic([abs(name)]).map(async file => {
  if (file === '/') throw new Error('Cannot remove the root file');
  const stats = await stat(file);

  if (stats.isDirectory()) {
    const files = await walk(file).map(remove);
    await list(file).map(remove);
    await promisify(fs.rmdir)(file);
    return file;
  }
  await promisify(fs.unlink)(file);
  return file;
})[0];



// Get some interesting info from the path
const stat = name => {
  const file = abs(name);
  const lstat = promisify(fs.lstat);
  return magic(lstat(file));
};



// Walk the walk (list all dirs and subdirectories)
const walk = name => {
  const file = abs(name);

  const deepper = async file => {
    if ((await stat(file)).isDirectory()) {
      return walk(file);
    }
    return [file];
  };

  return list(file).map(deepper).reduce((all, arr) => all.concat(arr), []);
};



// Create a new file with the specified contents
const write = (name, body = '') => {
  const file = abs(name);
  const writeFile = promisify(fs.writeFile);
  return magic(writeFile(file, body, 'utf-8'));
};



export default {
  abs,
  cat,
  exists,
  join,
  list,
  ls: list,
  mkdir,
  name,
  read: cat,
  remove,
  stat,
  walk,
  write
};
