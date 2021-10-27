module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: false,
  },
  extends: '../.eslintrc.js',
  parserOptions: {
    // Require Internet Explorer language compatibility.
    ecmaVersion: 5,
  },
  globals: {
    ArrayBuffer: 'readonly', // Supported in part by IE 10+
    Promise: 'readonly', // Not expected to be invoked when in IE runtime
  },
};
