const fs = require('fs');
const os = require('os');
const path = require('path');

function traceFsCalls() {
  const realFs = {};
  const fsMethods = Object.keys(fs).filter(function (key) {
    return key[0] === key[0].toLowerCase() && typeof fs[key] === 'function'
  });
  fsMethods.forEach(function (method) {
    realFs[method] = fs[method];
    fs[method] = traceFsProxy.bind({ method: method });
  });

  function traceFsProxy() {
    try {
      const result = realFs[this.method].apply(fs, arguments);
      if (arguments.length > 0 && typeof arguments[0] === 'string' && arguments[0].indexOf(process.env.TRACEFS) >= 0 && arguments[0].indexOf('tracefs.log') < 0) {
        const str = result && result.toString();
        const dumpedResult = this.method === 'watch' || result === undefined ? '' : ' = ' + JSON.stringify(str.length > 255 ? str.slice(0, 20) + '...' : result);
        realFs.appendFileSync.apply(fs, [path.join(os.tmpdir(), 'tracefs.log'), this.method + ' ' + arguments[0] + dumpedResult + '\n']);
      }
      return result;
    } catch (e) {
      if (arguments.length > 0 && typeof arguments[0] === 'string' && arguments[0].indexOf(process.env.TRACEFS) >= 0 && arguments[0].indexOf('tracefs.log') < 0)
        realFs.appendFileSync.apply(fs, [path.join(os.tmpdir(), 'tracefs.log'), this.method + ' ' + arguments[0] +  ' = ' + ((e.message.indexOf('ENOENT') >= 0 || e.message.indexOf('ENOTDIR') >= 0) ? e.message : e.stack) + '\n']);

      throw e;
    }
  }
}

if (process.env.TRACEFS) {
  traceFsCalls();
}
