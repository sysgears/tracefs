#!/usr/bin/env node

const tsNode = require.resolve('./ts-node.js').replace(/\\/g, '/');

require(tsNode);

process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} -r "${tsNode}"`;

const tracefs = require('./index');
tracefs.runCli();

module.exports = tracefs;
