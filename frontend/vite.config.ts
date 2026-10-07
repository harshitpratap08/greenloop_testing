import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sharedRoot = fileURLToPath(new URL("../shared", import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, projectRoot, ["PORT"]);
  const apiPort = process.env.PORT ?? rootEnv.PORT ?? "3001";
  const frontendPort = Number(process.env.VITE_PORT ?? 5173);
  return {
  envDir: projectRoot,
  server: { port: frontendPort, strictPort: true, proxy: { "/api": `http://127.0.0.1:${apiPort}` } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": sharedRoot,
    },
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  build: {
    outDir: "dist",
    rolldownOptions: {
      onwarn(warning, warn) {
        // Skip eval warnings from react-jvectormap
        if (
          warning.code === "EVAL" &&
          warning.id?.includes("@react-jvectormap")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  };
});
