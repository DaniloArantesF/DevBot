// @ts-check
const path = require("path");

module.exports = {
  reactStrictMode: true,
  transpilePackages: ['ui'],
  experimental: {
    appDir: true,
    outputFileTracingRoot: path.join(__dirname, "../../")
  },
};
