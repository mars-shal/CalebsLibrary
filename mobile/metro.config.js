// Metro watches ../shared so `mobile/` can import the framework-free core
// via relative paths (../../shared/…) or the @shared/* TS alias.
// convex/ stays OUTSIDE the bundle: mobile talks to Convex over the network
// (convex-react client), never by importing server modules.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.watchFolders = [
  path.resolve(__dirname, '../shared'),
  path.resolve(__dirname, '../convex/_generated'),
];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

module.exports = config;
