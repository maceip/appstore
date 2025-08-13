"use strict";
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExemptionList = void 0;
exports.resolveExemptionConfigPath = resolveExemptionConfigPath;
exports.parseExemptionConfig = parseExemptionConfig;
const glob = __importStar(require("glob"));
const allowlist_1 = require("./third_party/tsetse/allowlist");
const minimatch = __importStar(require("minimatch"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
/**
 * Stores exemption list configurations by rules. Supports commonly used Map
 * operations.
 */
class ExemptionList {
    constructor(copyFrom) {
        var _a;
        this.map = new Map((_a = copyFrom === null || copyFrom === void 0 ? void 0 : copyFrom.map.entries()) !== null && _a !== void 0 ? _a : []);
    }
    get(rule) {
        return this.map.get(rule);
    }
    set(rule, allowlistEntry) {
        this.map.set(rule, allowlistEntry);
    }
    entries() {
        return this.map.entries();
    }
    get size() {
        return this.map.size;
    }
}
exports.ExemptionList = ExemptionList;
/** Get the path of the exemption configuration file from compiler options. */
function resolveExemptionConfigPath(configFilePath) {
    if (!ts.sys.fileExists(configFilePath)) {
        configFilePath += ts.Extension.Json;
        if (!ts.sys.fileExists(configFilePath)) {
            return undefined;
        }
    }
    const { config } = ts.readConfigFile(configFilePath, ts.sys.readFile);
    const options = config === null || config === void 0 ? void 0 : config.compilerOptions;
    const configFileDir = path.dirname(configFilePath);
    if (Array.isArray(options === null || options === void 0 ? void 0 : options.plugins)) {
        for (const plugin of options.plugins) {
            if (plugin.name !== 'tsec')
                continue;
            const { exemptionConfig } = plugin;
            if (typeof exemptionConfig === 'string') {
                // Path of the exemption config is relative to the path of
                // tsconfig.json. Resolve it to the absolute path.
                const resolvedPath = path.resolve(configFileDir, exemptionConfig);
                // Always returned a path to an existing file so that tsec won't crash.
                if (ts.sys.fileExists(resolvedPath)) {
                    return resolvedPath;
                }
            }
        }
    }
    if (typeof config.extends === 'string') {
        return resolveExemptionConfigPath(path.resolve(configFileDir, config.extends));
    }
    return undefined;
}
/** Create a Diagnostic for a JSON node from a configuration file */
function getDiagnosticErrorFromJsonNode(node, file, messageText) {
    const start = node.getStart(file);
    const length = node.getEnd() - start;
    return {
        source: 'tsec',
        category: ts.DiagnosticCategory.Error,
        code: 21110,
        file,
        start,
        length,
        messageText,
    };
}
/** Parse the content of the exemption configuration file. */
function parseExemptionConfig(exemptionConfigPath) {
    const errors = [];
    const jsonContent = ts.sys.readFile(exemptionConfigPath);
    const jsonSourceFile = ts.parseJsonText(exemptionConfigPath, jsonContent);
    if (!jsonSourceFile.statements.length) {
        errors.push({
            source: 'tsec',
            category: ts.DiagnosticCategory.Error,
            code: 21110,
            file: jsonSourceFile,
            start: 1,
            length: undefined,
            messageText: 'Invalid exemtpion list',
        });
        return errors;
    }
    const jsonObj = jsonSourceFile.statements[0].expression;
    if (!ts.isObjectLiteralExpression(jsonObj)) {
        errors.push(getDiagnosticErrorFromJsonNode(jsonObj, jsonSourceFile, 'Exemption configuration requires a value of type object'));
        return errors;
    }
    const exemption = new ExemptionList();
    const baseDir = path.dirname(exemptionConfigPath);
    const globOptions = { cwd: baseDir, absolute: true, silent: true };
    const isWin = os.platform() === 'win32';
    for (const prop of jsonObj.properties) {
        if (!ts.isPropertyAssignment(prop)) {
            errors.push(getDiagnosticErrorFromJsonNode(prop, jsonSourceFile, 'Property assignment expected'));
            continue;
        }
        if (prop.name === undefined)
            continue;
        if (!ts.isStringLiteral(prop.name) ||
            !prop.name.getText(jsonSourceFile).startsWith(`"`)) {
            errors.push(getDiagnosticErrorFromJsonNode(prop.name, jsonSourceFile, 'String literal with double quotes expected'));
            continue;
        }
        const ruleName = prop.name.text;
        if (!ts.isArrayLiteralExpression(prop.initializer)) {
            errors.push(getDiagnosticErrorFromJsonNode(prop.initializer, jsonSourceFile, `Exemption entry '${ruleName}' requires a value of type Array`));
            continue;
        }
        const fileNames = [];
        const patterns = [];
        for (const elem of prop.initializer.elements) {
            if (!ts.isStringLiteral(elem)) {
                errors.push(getDiagnosticErrorFromJsonNode(elem, jsonSourceFile, `Item of exemption entry '${ruleName}' requires values of type string`));
                continue;
            }
            let pathLike = path.resolve(baseDir, elem.text);
            if (isWin) {
                pathLike = pathLike.replace(/\\/g, '/');
            }
            if (glob.hasMagic(elem.text, globOptions)) {
                patterns.push(
                // Strip the leading and trailing '/' from the stringified regexp.
                minimatch.makeRe(pathLike, {}).toString().slice(1, -1));
            }
            else {
                fileNames.push(pathLike);
            }
        }
        exemption.set(ruleName, {
            reason: allowlist_1.ExemptionReason.UNSPECIFIED,
            path: fileNames,
            regexp: patterns,
        });
    }
    return errors.length > 0 ? errors : exemption;
}
//# sourceMappingURL=exemption_config.js.map