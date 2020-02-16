#!/usr/bin/env node
/*
Sets up a new Typescript project
*/
"use strict";
const fs = require("fs");

async function readJson(path) {
    const rawdata = await fs.promises.readFile(path);
    return JSON.parse(rawdata);
}

function exists(path) {
    return new Promise((resolve) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            resolve(!err);
        })
    });
}

function strip(mlstring) {
    let lines = mlstring.split(/\n/g);
    if (lines[0].trim() === "")
        lines = lines.slice(1);
    const indent = lines.reduce((a, line) => {
        if (line.trim() === "")
            return a;
        const leading = line.search(/\S|$/);
        return (a === undefined || leading < a) ? leading : a;
    }, undefined)
    lines = lines.map(line => {
        if (line.trim() === "")
            return "";
        return line.slice(indent);
    })
    return lines.join('\n');
}

async function configurePackageJson() {
    const packageJson = await readJson('package.json');
    packageJson["main"] = "dist/index.js";
    packageJson["types"] = "dist/index.d.ts";
    const scripts = packageJson["scripts"] || {};
    scripts["build"] = "tsc-pnp -b";
    scripts["test"] = "jest --coverage";
    packageJson["scripts"] = scripts;
    const devDeps = packageJson["devDependencies"] || {};
    devDeps["@types/jest"] = "^24.9.1";
    devDeps["@types/jest-in-case"] = "^1.0.1";
    devDeps["jest"] = "^25.1.0";
    devDeps["jest-in-case"] = "^1.0.2";
    devDeps["ts-jest"] = "^25.0.0";
    devDeps["tsc-pnp"] = "^0.1.0";
    devDeps["typescript"] = "^3.7.5";
    packageJson["devDependencies"] = devDeps;
    const packageJsonText = JSON.stringify(packageJson, null, 2);
    await fs.promises.writeFile('package.json', packageJsonText);
}

async function createIndexTs() {
    const path = "src/index.ts"
    if (await exists(path)) {
        console.warn(`Skipping creation of ${path} which already exists`);
        return;
    }
    await fs.promises.writeFile(path, strip(`
        // TODO: replace with your own code
        export function msg(): string { return "Hello World!"; }
        console.log(msg());
    `));
}

async function createTsConfigJson() {
    const path = "tsconfig.json"
    if (await exists(path)) {
        console.warn(`Skipping creation of ${path} which already exists`);
        return;
    }
    const tsConfig = {
        "compilerOptions": {
            "strict": true,
     
            "sourceMap": true,
            "declarationMap": true,
            "declaration": true,
     
            "rootDir": "src",
            "baseUrl": ".",
            "outDir": "dist/",
            "composite": true,
            "incremental": true,
            "tsBuildInfoFile": "dist/.tsbuildinfo",
    
            "module": "es6",
            "moduleResolution": "Node",
            "esModuleInterop": true,
            "target": "ES6",
            "lib": [
            ]
        },
        "include": [
            "src/**/*"
        ]
    }
    await fs.promises.writeFile(path, JSON.stringify(tsConfig, null, 4));
}

async function createIndexTestTs() {
    const path = "test/index.test.ts"
    if (await exists(path)) {
        console.warn(`Skipping creation of ${path} which already exists`);
        return;
    }
    await fs.promises.writeFile(path, strip(`
        import {msg} from "../src/index";

        // TODO: Replace with your own tests
        test('msg works', () => {
            expect(msg()).toBe("Hello World!");
        })
    `))
}

async function createGitIgnore() {
    const path = ".gitignore"
    if (await exists(path)) {
        console.warn(`Skipping creation of ${path} which already exists`);
        return;
    }
    await fs.promises.writeFile(path, strip(`
        coverage/
        dist/
        dist-test/
        .vscode/
    `));
}

async function createTestTsConfigJson() {
    if (await exists("test/tsconfig.json")) {
        console.warn("Skipping creation of test/tsconfig.json which already exists");
        return;
    }
    const tsConfig = {
        "compilerOptions": {
            "strict": true,
    
            "sourceMap": true,
            "declarationMap": true,
            "declaration": true,
    
            "baseUrl": ".",
            "outDir": "../dist-test/",
            "composite": true,
            "incremental": true,
            "tsBuildInfoFile": "dist-test/.tsbuildinfo",
    
            // TODO: reconsider this configuration
            "module": "es6",
            "moduleResolution": "node",
            "esModuleInterop": true,
            "target": "ES6",
            "lib": [
            ]
        },
        "references": [
            {"path": "../src/tsconfig.json"}
        ]
    }
    await fs.promises.writeFile("test/tsconfig.json", JSON.stringify(tsConfig, null, 4));
}

async function createJestConfig() {
    const path = "jest.config.js";
    if (await exists(path)) {
        console.warn(`Skipping creation of ${path} which already exists`);
        return;
    }
    await fs.promises.writeFile(path, strip(`
        module.exports = {
            preset: 'ts-jest',
            testEnvironment: 'node',
            modulePathIgnorePatterns: ["<rootDir>/dist/"],
            globals: {
                "ts-jest": {
                    tsConfig: 'test/tsconfig.json',
                    packageJson: 'package.json',
                },
            },
        };
    `));
}

async function main(args) {
    await fs.promises.mkdir('src', {recursive: true});
    await fs.promises.mkdir('test', {recursive: true});
    await createIndexTs();
    await createIndexTestTs();
    await createTsConfigJson();
    await createTestTsConfigJson();
    await createJestConfig();
    await createGitIgnore();
    await configurePackageJson();
    console.log("You can now run `yarn install` or `yarn build` or `yarn test`");
}

const [,, ...args] = process.argv;
main(args).catch((e) => {console.error("Failed", e)});