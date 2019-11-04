import fs from 'fs';
import util from 'util';
import chalkModule, { Chalk } from 'chalk';
import crossSpawn from 'cross-spawn';

const TRIM_STR_LEN = 30;

const dump = (chalk: Chalk, value: any, isFilename?: boolean): string => {
  if (typeof value === 'undefined') {
    return '';
  } else if (value === null) {
    return chalk.blue('' + value);
  } else if (typeof value === 'object' && value.message && value.stack) {
    return chalk.redBright(
      value.message.indexOf('ENOENT') >= 0 || value.message.indexOf('ENOTDIR') >= 0 ? value.message : value.stack
    );
  } else if (
    typeof value === 'object' &&
    typeof value.isFile === 'function' &&
    typeof value.isDirectory === 'function' &&
    typeof value.isSymbolicLink === 'function'
  ) {
    return chalk.yellow(
      util.inspect(
        Object.assign(
          {},
          { _isFile: value.isFile(), _isDirectory: value.isDirectory(), _isSymlink: value.isSymbolicLink() },
          value
        ),
        { depth: null, breakLength: Infinity }
      )
    );
  } else if (typeof value === 'function') {
    const str = value.toString().replace(/[\n\r]/g, '');
    return chalk.blue(str.length <= 255 ? str : str.slice(0, TRIM_STR_LEN) + '...');
  } else if (typeof value === 'boolean') {
    return value ? chalk.green('' + value) : chalk.red('' + value);
  } else if (typeof value === 'number') {
    return chalk.yellow('' + value);
  } else if (!isFilename && (Buffer.isBuffer(value) || typeof value === 'string')) {
    const str = value.toString().replace(/[\n\r]/g, '');
    const result = "'" + (str.length <= 255 ? str : str.slice(0, TRIM_STR_LEN) + '...') + "'";
    return chalk.cyan(result);
  } else if (typeof value === 'object') {
    return chalk.blueBright(util.inspect(value, { depth: null, breakLength: Infinity }));
  }

  const str = util.inspect(value, { depth: null, maxArrayLength: null, breakLength: Infinity });
  const result = isFilename || str.length <= 255 ? str : str.slice(0, TRIM_STR_LEN) + "...'";

  return isFilename ? chalk.green(result) : result;
};

const traceFsCalls = (expr?: string) => {
  let logFile, traceSubstring;
  if (expr) {
    const parts = expr.split(':').map(x => x.trim());
    if (parts.length >= 1) {
      logFile = parts[0].length > 0 ? parts[0] : undefined;
      if (parts.length > 1) {
        traceSubstring = parts[1];
      }
    }
  }
  const chalk = new chalkModule.constructor({ enabled: !logFile });
  const realFs = { ...fs };

  const traceFsProxy = (method: string, ...args: any[]) => {
    let hrTime = process.hrtime();
    let startTimeUs, endTimeUs;
    startTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
    try {
      if (['watch', 'watchFile'].indexOf(method) >= 0 && (!traceSubstring || args[0].indexOf(traceSubstring) >= 0)) {
        const idx = ['undefined', 'function'].indexOf(typeof args[1]) >= 0 ? 1 : 2;
        const listener = args[idx];
        const watchListener = (...wargs) => {
          let hrTime = process.hrtime();
          startTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
          try {
            if (listener) {
              listener.apply(listener, wargs);
            }
          } finally {
            hrTime = process.hrtime();
            endTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
            const msg =
              chalk.magenta((endTimeUs - startTimeUs).toFixed(1) + ' us ') +
              method +
              '(' +
              args.map((x, idx) => dump(chalk, x, idx === 0)).join(', ') +
              ')->callback(' +
              wargs.map(x => dump(chalk, x)).join(', ') +
              ')';
            if (!logFile) {
              console.log(msg);
            } else {
              realFs.appendFileSync(logFile, msg + '\n');
            }
          }
        };
        args[idx] = (...wargs) => watchListener(...wargs);
      }
      const result = realFs[method].apply(realFs, args);
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        args[0].indexOf(logFile) < 0 &&
        (!traceSubstring || args[0].indexOf(traceSubstring) >= 0)
      ) {
        hrTime = process.hrtime();
        endTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
        const msg =
          chalk.magenta((endTimeUs - startTimeUs).toFixed(1) + ' us ') +
          method +
          '(' +
          args.map((x, idx) => dump(chalk, x, idx === 0)).join(', ') +
          ')' +
          (result === undefined ? '' : ' => ' + dump(chalk, result));
        if (!logFile) {
          console.log(msg);
        } else {
          realFs.appendFileSync(logFile, msg + '\n');
        }
      }
      return result;
    } catch (e) {
      if (args.length > 0 && typeof args[0] === 'string' && (!traceSubstring || args[0].indexOf(traceSubstring)) >= 0) {
        endTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
        const msg =
          chalk.magenta((endTimeUs - startTimeUs).toFixed(1) + ' us ') +
          method +
          '(' +
          args.map((x, idx) => dump(chalk, x, idx === 0)).join(', ') +
          ') => ' +
          dump(chalk, e);
        if (!logFile) {
          console.log(msg);
        } else {
          realFs.appendFileSync(logFile, msg + '\n');
        }
      }

      throw e;
    }
  };

  const fsMethods = Object.keys(fs).filter(key => key[0] === key[0].toLowerCase() && typeof fs[key] === 'function');
  fsMethods.forEach(method => {
    fs[method] = (...args) => traceFsProxy(method, ...args);
  });
};

const help = error => {
  const logFn = error ? console.error : console.log;
  process.exitCode = error ? 1 : 0;

  logFn(`Usage: tracefs node ./script`);
  logFn(`Usage: tracefs -e substring node ./script`);
  logFn(`Usage: tracefs -e tracefs.log:substring node ./script`);
  logFn();
};

const run = (name, argv) => {
  let { NODE_OPTIONS } = process.env;
  NODE_OPTIONS = `${NODE_OPTIONS || ``} --require ${__filename}`.trim();

  const child = crossSpawn(name, argv, {
    env: { ...process.env, NODE_OPTIONS },
    stdio: `inherit`
  });

  child.on(`exit`, code => {
    process.exitCode = code !== null ? code : 1;
  });
};

if (require.main === module) {
  const [, , name, ...rest] = process.argv;

  if (name === `--help` || name === `-h`) {
    help(false);
  } else if (name === `-e` && rest.length > 1) {
    process.env.TRACEFS = rest[0];
    run(rest[1], rest.slice(2));
  } else if (typeof name !== `undefined` && name[0] !== `-`) {
    run(name, rest);
  } else {
    help(true);
  }
} else {
  traceFsCalls(process.env.TRACEFS);
}

export default traceFsCalls;
