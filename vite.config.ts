import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://artfuldodger10.github.io/portfolio/ on GitHub Pages, from / locally.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/portfolio/' : '/',
  plugins: [react()],
  build: {
    // three.js is ~290 KB gzipped and loads after the text; that is the budget, not a mistake
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // keep three.js and friends in one cacheable chunk, separate from the page code
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/](three|@react-three|postprocessing|three-stdlib|troika)/ }],
        },
      },
    },
  },
})
