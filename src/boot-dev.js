#!/usr/bin/env node

require('../.pnp.js').setup();

const tsNode = require
  .resolve('ts-node/register/transpile-only')
  .replace(/\\/g, '/');

require(tsNode);

process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} -r "${tsNode}"`;

const tracefs = require('./index');
tracefs.runCli();

module.exports = tracefs;
