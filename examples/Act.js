const ModernAct = require(`../index.js`);

const act = new ModernAct(3000);

act.setStartMessage(`(listening) $method :$port$path`);

act.compile();
act.server();