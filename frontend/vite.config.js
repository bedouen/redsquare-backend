/*import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // ou vue, selon ton framework

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    allowedHosts: ['redsquare-o-production.up.railway.app']
  },
  server: {
    host: true,
    allowedHosts: ['redsquare-o-production.up.railway.app']
  }
})