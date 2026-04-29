import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_PATH = path.join(__dirname, "node_modules");
Module.Module._initPaths();

const { ESLint } = await import("eslint");

const eslint = new ESLint({
  cwd: __dirname,
});

const results = await eslint.lintFiles(["."]);
const formatter = await eslint.loadFormatter("stylish");
const output = formatter.format(results);

if (output) {
  process.stdout.write(output);
}

const errorCount = results.reduce(
  (total, result) => total + result.errorCount + result.fatalErrorCount,
  0,
);

process.exitCode = errorCount > 0 ? 1 : 0;
