import viteConfig from "./vite.config.js";
import * as fs from "fs";

// TODO: possibly get these from App.jsx
const routes = [
  "/menu",
  "/watch"
];
const dir = "./src/" + viteConfig.build.outDir;

for (const route of routes) {
  fs.cpSync(dir + "/index.html", dir + route + "/index.html");
}
