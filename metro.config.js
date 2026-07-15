const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// pnpm's node_modules is symlink-based (packages live under node_modules/.pnpm and are
// symlinked into place) — Metro doesn't follow those symlinks for nested resolution by
// default, which breaks resolving a dependency's own dependencies (e.g. nativewind ->
// react-native-css-interop) unless this is enabled.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './src/global.css' });
