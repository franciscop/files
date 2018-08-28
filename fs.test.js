// fs-array
import {
  abs,
  cat,
  exists,
  join,
  list,
  ls,
  mkdir,
  name,
  remove,
  // read,
  readFile,
  stat,
  walk,
  write
} from './fs';

// Native file system and path
import nfs from 'fs';
import path from 'path';
import { promisify } from 'util';



describe('abs', () => {
  it('gets the defaults right', async () => {
    expect(await abs()).toBe(__dirname);
    expect(await abs('demo')).toBe(join(__dirname, '/demo'));
  });

  it('get the absolute path of the passed args', async () => {
    expect(await abs('demo', process.cwd())).toBe(join(__dirname, '/demo'));
    expect(await abs('demo', __dirname)).toBe(join(__dirname, '/demo'));
  });

  it('ignores the second parameter if not a string', async () => {
    expect(await abs('demo', 0)).toBe(join(__dirname, '/demo'));
    expect(await abs('demo', 5)).toBe(join(__dirname, '/demo'));
    expect(await abs('demo', true)).toBe(join(__dirname, '/demo'));
  });
});



describe('cat', () => {
  it('can read a markdown file', async () => {
    expect(await cat('demo/readme.md')).toContain('# Hello!');
  });
});



describe('list', () => {
  it('defaults to the current folder', async () => {
    const files = await list();
    expect(files).toContain(__dirname + '/fs.js');
  });

  it('can load the demo', async () => {
    const files = await list('demo', __dirname);
    expect(files).toContain(__dirname + '/demo/a');
    expect(files).toContain(__dirname + '/demo/readme.md');
  });
});



describe('exists', () => {
  it('defaults to the current dir', async () => {
    expect(await exists()).toBe(true);
  });

  it('can check the demo', async () => {
    expect(await exists('demo')).toBe(true);
    expect(await exists('aaa')).toBe(false);
  });
});



describe('join', () => {
  it('can do a simple join', async () => {
    expect(join(__dirname, 'demo')).toBe(path.join(__dirname, 'demo'));
  });
});



describe('mkdir', () => {
  beforeEach(() => promisify(nfs.rmdir)(abs('demo/b')).catch(err => {}));
  afterEach(() => promisify(nfs.rmdir)(abs('demo/b')).catch(err => {}));

  it('create a new directory', async () => {
    expect(await exists('demo/b')).toBe(false);
    await mkdir('demo/b');
    expect(await exists('demo/b')).toBe(true);
  });
});



describe('name', () => {
  it('find the file name in the path', async () => {
    expect(await name('demo/abs.js')).toBe('abs.js');
    expect(await name(abs('demo/abs.js'))).toBe('abs.js');
  });
});



describe('remove', () => {
  // beforeEach(() => promisify(nfs.rmdir)(abs('demo/b')).catch(err => {}));
  // afterEach(() => promisify(nfs.rmdir)(abs('demo/b')).catch(err => {}));
  it('removes a file', async () => {
    await write('demo/remove.md', 'Hello!');
    expect(await cat('demo/remove.md')).toBe('Hello!');
    await remove('demo/remove.md');
    expect(await exists('demo/remove.md')).toBe(false);
  });

  it('removes a directory', async () => {
    await mkdir('demo/b');
    expect(await exists('demo/b')).toBe(true);
    await remove('demo/b');
    expect(await exists('demo/b')).toBe(false);
  });

  it('removes a directory with files', async () => {
    await mkdir('demo/b');
    await write('demo/b/remove.md', 'Hello!');
    expect(await exists('demo/b')).toBe(true);
    expect(await cat('demo/b/remove.md')).toBe('Hello!');
    await remove('demo/b');
    expect(await exists('demo/b')).toBe(false);
  });

  it('removes a directory with deeply nested files', async () => {
    await mkdir('demo/x');
    await write('demo/x/remove.md', 'Hello!');
    await mkdir('demo/x/c');
    await write('demo/x/c/remove.md', 'Hello!');
    expect(await exists('demo/x')).toBe(true);
    expect(await cat('demo/x/remove.md')).toBe('Hello!');
    expect(await exists('demo/x/c')).toBe(true);
    expect(await cat('demo/x/c/remove.md')).toBe('Hello!');
    await remove('demo/x');
    expect(await exists('demo/x')).toBe(false);
  });

  it('cannot remove the root', async () => {
    await expect(remove('/')).rejects.toThrow(/remove the root/);
  });
});



describe.skip('read', () => {
  it('can read a markdown file', async () => {
    expect(await read('demo/readme.md')).toContain('# Hello!');
  });

  it('can read a directory', async () => {
    expect(await read()).toContain(__dirname + '/LICENSE');
    expect(await read('.')).toContain(__dirname + '/LICENSE');
  });
});



describe('stat', () => {
  it('defaults to the current dir', async () => {
    const readme = await stat();
    expect(readme.isDirectory()).toBe(true);
  });

  it('can analyze whether a path is a directory or not', async () => {
    const readme = await stat('demo/readme.md');
    expect(readme.isDirectory()).toBe(false);

    const demo = await stat('demo');
    expect(demo.isDirectory()).toBe(true);
  });
});



describe('walk', () => {
  it('defaults to the current directory', async () => {
    expect(await walk()).toContain(__dirname + '/fs.js');
  });

  it('can deep walk', async () => {
    const files = await walk('demo');
    expect(files).toContain(__dirname + '/demo/readme.md');
    expect(files).toContain(__dirname + '/demo/a/readme.md');
    expect(files).toContain(__dirname + '/demo/a/b/readme.md');
  });
});



describe('write', () => {
  beforeEach(() => promisify(nfs.unlink)(abs('demo/deleteme.md')).catch(err => {}));
  afterEach(() => promisify(nfs.unlink)(abs('demo/deleteme.md')).catch(err => {}));

  it('creates a new file', async () => {
    expect(await exists('demo/deleteme.md')).toBe(false);
    await write('demo/deleteme.md', 'Hello!');
    expect(await cat('demo/deleteme.md')).toBe('Hello!');
    expect(await exists('demo/deleteme.md')).toBe(true);
  });

  it('creates a new empty file', async () => {
    expect(await exists('demo/deleteme.md')).toBe(false);
    await write('demo/deleteme.md');
    expect(await exists('demo/deleteme.md')).toBe(true);
  });
});

// create(), read(), update(), remove()


describe('other tests', () => {
  it('can walk and filter and map', async () => {
    const files = await walk('demo')
      .filter(file => /\/readme\.md$/.test(file))
      .map(readFile);

    expect(files).toContain('# Sub-sub-level\n');
  });
});
