const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

function traceFsCalls(traceSubstring, useConsole) {
  const realFs = {};
  const fsMethods = Object.keys(fs).filter(function (key) {
    return key[0] === key[0].toLowerCase() && typeof fs[key] === 'function'
  });
  fsMethods.forEach(function (method) {
    realFs[method] = fs[method];
    fs[method] = traceFsProxy.bind({ method: method });
  });

  function traceFsProxy() {
    let hrTime = process.hrtime();
    startTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
    try {
      if (['watch', 'watchFile'].indexOf(this.method) >= 0) {
        const idx = ['undefined', 'function'].indexOf(typeof arguments[1]) >= 0 ? 1 : 2;
        const listener = arguments[idx];
        arguments[idx] = watchListener.bind({ method: this.method, filePath: arguments[0] });
        function watchListener() {
          let hrTime = process.hrtime();
          startTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
          try {
            if (listener) {
              listener.apply(listener, arguments);
            }
          } finally {
            hrTime = process.hrtime();
            endTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
            const msg = (endTimeUs - startTimeUs).toFixed(1) + ' us ' + this.method + '(' + this.filePath + ')->callback(' + util.inspect(Array.from(arguments), false, null) + ')';
            if (useConsole) {
              console.log(msg);
            } else {
              realFs.appendFileSync.apply(fs, [path.join(os.tmpdir(), 'tracefs.log'), msg + '\n']);
            }
          }
        }
      }
      const result = realFs[this.method].apply(fs, arguments);
      if (arguments.length > 0 && typeof arguments[0] === 'string' && arguments[0].indexOf(traceSubstring) >= 0 && arguments[0].indexOf('tracefs.log') < 0) {
        const str = result && result.toString();
        const dumpedResult = this.method === 'watch' || result === undefined ? '' : ' = ' + JSON.stringify(str.length > 255 ? str.slice(0, 20) + '...' : result);
        hrTime = process.hrtime();
        endTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
        const msg = (endTimeUs - startTimeUs).toFixed(1) + ' us ' + this.method + ' ' + arguments[0] + dumpedResult;
        if (useConsole) {
          console.log(msg);
        } else {
          realFs.appendFileSync.apply(fs, [path.join(os.tmpdir(), 'tracefs.log'), msg + '\n']);
        }
      }
      return result;
    } catch (e) {
      if (arguments.length > 0 && typeof arguments[0] === 'string' && arguments[0].indexOf(traceSubstring) >= 0 && arguments[0].indexOf('tracefs.log') < 0) {
        endTimeUs = hrTime[0] * 1000000 + hrTime[1] / 1000;
        const msg = (endTimeUs - startTimeUs).toFixed(1) + ' us ' + this.method + ' ' + arguments[0] +  ' = ' + ((e.message.indexOf('ENOENT') >= 0 || e.message.indexOf('ENOTDIR') >= 0) ? e.message : e.stack);
        if (useConsole) {
          console.log(msg);
        } else {
          realFs.appendFileSync.apply(fs, [path.join(os.tmpdir(), 'tracefs.log'), msg + '\n']);
        }
      }

      throw e;
    }
  }
}

if (process.env.TRACEFS) {
  const idx = process.env.TRACEFS.indexOf('console:');
  const traceSubstring = idx >= 0 ? process.env.TRACEFS.substring(8) : process.env.TRACEFS;
  traceFsCalls(traceSubstring, idx >= 0);
}
