import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "fs";
import type { ServerOptions as HttpsServerOptions } from "https";

// Function to safely read files, handles potential errors
const readIfExists = (filePath: string): Buffer | undefined => {
  try {
    return fs.readFileSync(filePath);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.warn(
        `Certificate file not found at ${filePath}. HTTPS disabled (custom certs).`,
      );
      return undefined;
    }
    throw err; // Re-throw other errors
  }
};

// Determine key and cert paths (adjust filenames if mkcert generated different ones)
const keyPath = "./localhost+2-key.pem"; // Adjust if your filename is different
const certPath = "./localhost+2.pem"; // Adjust if your filename is different

// Prepare HTTPS configuration object conditionally
let httpsConfig: HttpsServerOptions | undefined; // <-- Type is now ServerOptions or undefined

const key = readIfExists(keyPath);
const cert = readIfExists(certPath);

if (key && cert) {
  // Only create the object if both key and cert are Buffers
  httpsConfig = { key, cert };
} else {
  // Set to undefined if files are missing, type matches expected 'undefined'
  httpsConfig = undefined;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    // Assign the prepared config object or undefined
    https: httpsConfig,
    // Optional: Specify port if needed
    port: 8081,
    host: true,
  },
  preview: {
    https: httpsConfig,
    port: 8081,
  },

  // resolve: { // Not needed if using tsconfigPaths plugin
  //   alias: {
  //     "@": path.resolve(__dirname, "./src"),
  //   },
  // },
});
