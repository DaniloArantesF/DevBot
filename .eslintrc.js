module.exports = {
  root: true,
  extends: ['custom'], // load from package config
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
};
