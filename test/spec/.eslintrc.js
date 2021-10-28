module.exports = {
  env: {
    mocha: true,
  },
  globals: {
    window: 'readonly',
  },
  extends: ['../../.eslintrc.js', 'plugin:wdio/recommended'],
  plugins: ['wdio'],
};
