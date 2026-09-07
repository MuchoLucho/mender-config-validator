import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [vue(), viteSingleFile()],
}));
