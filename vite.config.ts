import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite cannot exclude part of publicDir, and public/game_files is often a
// symlink to ~300 MB of game data that the app loads from VUE_APP_GAME_FILES.
function copyPublicDirExceptGameFiles(): Plugin {
  let publicDir = '';
  let outDir = '';
  return {
    name: 'copy-public-dir-except-game-files',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      const gameFiles = path.join(publicDir, 'game_files');
      fs.cpSync(publicDir, outDir, { recursive: true, filter: src => src !== gameFiles });
    },
  };
}

export default defineConfig({
  plugins: [
    vue(),
    copyPublicDirExceptGameFiles(),
  ],
  envPrefix: 'VUE_APP_',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    copyPublicDir: false,
  },
});
