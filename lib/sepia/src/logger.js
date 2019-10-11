var bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'bokor',
});

module.exports = logger;
