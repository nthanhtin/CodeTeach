import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/CodeTeach/',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets/**/*',
          dest: 'assets',
          filter: (filepath) => {
            return !/\.bak$/.test(filepath) && !/README(\.md)?$/i.test(filepath);
          }
        }
      ]
    })
  ]
});
