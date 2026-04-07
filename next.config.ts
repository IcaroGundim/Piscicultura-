import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const configDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent incorrect workspace root inference when multiple lockfiles exist.
    root: configDir,
  },
};

export default nextConfig;
