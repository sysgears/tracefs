#!/usr/bin/env node

require('../.pnp.js').setup();

const path = require(`path`);
const root = path.dirname(__dirname);

require(`@babel/register`)({
  root,
  extensions: [`.tsx`, `.ts`],
  only: [p => p.startsWith(root)]
});

const tracefs = require('./index');
tracefs.runCli();

module.exports = tracefs;
