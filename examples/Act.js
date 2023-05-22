const FS = require(`fs`);
const convert = require(`xml-js`);
const express = require(`express`);

const ModernAct = require(`../index.js`);

const act = new ModernAct(3000, FS, convert, express);

act.setStartMessage(`(listening) $method :$port$path`);

act.compile();
act.server();