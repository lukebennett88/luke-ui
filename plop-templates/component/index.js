'use strict';

module.exports = process.env.NODE_ENV === 'production' ? require('./dist/index.cjs.prod') : require('./dist/index.cjs.dev');
