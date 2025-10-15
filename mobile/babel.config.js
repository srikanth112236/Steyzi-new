module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@/components': './src/components',
            '@/components/ui': './src/components/ui',
            '@/constants': './src/constants',
            '@/contexts': './src/contexts',
            '@/hooks': './src/hooks',
            '@/navigation': './src/navigation',
            '@/screens': './src/screens',
            '@/store': './src/store',
            '@/utils': './src/utils'
          }
        }
      ]
    ]
  };
};
