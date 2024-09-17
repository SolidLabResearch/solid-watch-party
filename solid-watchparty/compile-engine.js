import {compileConfig} from "componentsjs";
import fs from "node:fs";
import process from "process";

// Compiles a configuration to a module (single file) that exports the instantiated instance,
// where all dependencies are injected.
// This is a simplified version of components-compile-config that is shipped with Components.js.

const mainModulePath = process.cwd();
const configResourceUri = 'urn:comunica:default:Runner';
const configPath = `./engine-config/config.json`;
let exportVariableName = 'urn:comunica:default:init/actors#query';

compileConfig(mainModulePath, configPath, configResourceUri, exportVariableName, false, true)
    .then((out) => {
        // This instantiation is unneeded (MUST be done for excluding Components.js in browser environnments)
        out = out.replace('new (require(\'@comunica/runner\').Runner)', '');
        out = out.replace('module.exports =', 'export default');
        out = out.replaceAll(/require\(([^)]+)\)/g, '(await import($1))');
        fs.writeFile(`./engine-config/engine.js`, out + "\n", err => {
            if (err) {
                console.error(`error with ./engine-config/engine.js:\n`, err);
            } else {
                console.log(`made ./engine-config/engine.js`)
            }
        });
    }).catch((error) => {
    console.error(`${error.stack}\n`);
});
