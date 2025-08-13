"use strict";
// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustedTypesChecks = void 0;
const utils_1 = require("@typescript-eslint/utils");
const configured_checker_1 = require("./vendors/tsec/common/configured_checker");
const ts = __importStar(require("typescript"));
const tsetse_compat_1 = require("./tsetse_compat");
const debug_1 = __importDefault(require("debug"));
const logging_js_1 = require("./logging.js");
const logDebug = (0, debug_1.default)('safety-web:trusted_types_checks');
const createRule = utils_1.ESLintUtils.RuleCreator(() => 'safety-web');
// Cached checker instantiated only once per compilation unit.
const checkers = new Map();
/**
 * Rule to check Trusted Types compliance
 */
exports.trustedTypesChecks = createRule({
    name: 'trusted-types-checks',
    meta: {
        type: 'problem',
        docs: {
            description: 'Checks Trusted Types compliance',
            recommended: true,
        },
        messages: Object.assign(Object.assign({}, tsetse_compat_1.messageIdMap), { unknown_rule_triggered: 'trusted-types-checks reported a violation that could not be mapped to a known violation id.' }),
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        var _a;
        // Skip checking declaration files
        logDebug(context);
        if ((_a = context.filename) === null || _a === void 0 ? void 0 : _a.endsWith('.d.ts')) {
            return {};
        }
        const parserServices = utils_1.ESLintUtils.getParserServices(context);
        // When a repository is split into different projects (several tsconfig.json) or when no tsconfig.json is specified, different ts programs (and associated ts.TypeChecker) will be returned by the TS service.
        // A new tsetse checker should be created for every different typechecker, so we cache tsetse per ts.Program.
        // In well set up projects, the number of checker instances should remain low. In the worst case when no tsconfig is defined, eslint will complain when more than 8 files fall in inferred projects.
        const programForCurrentFile = parserServices.program;
        if (!checkers.get(programForCurrentFile)) {
            checkers.set(programForCurrentFile, (0, configured_checker_1.getConfiguredChecker)(parserServices.program, ts.createCompilerHost(parserServices.program.getCompilerOptions())).checker);
            logDebugNewProgram(context.filename, programForCurrentFile);
        }
        const checker = checkers.get(programForCurrentFile);
        return {
            Program(node) {
                const parserServices = utils_1.ESLintUtils.getParserServices(context);
                const rootNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                // Run all enabled checks
                const { failures } = checker.execute(rootNode, true);
                // Report the detected errors
                for (const failure of failures) {
                    const diagnostic = failure.toDiagnostic();
                    const start = ts.getLineAndCharacterOfPosition(rootNode, diagnostic.start);
                    const end = ts.getLineAndCharacterOfPosition(rootNode, diagnostic.end);
                    context.report({
                        loc: {
                            start: { line: start.line + 1, column: start.character },
                            end: { line: end.line + 1, column: end.character },
                        },
                        messageId: (0, tsetse_compat_1.tsetseMessageToMessageId)(
                        // TODO: refine `toDiagnostic` to refine type and remove this cast.
                        diagnostic.messageText) || 'unknown_rule_triggered',
                        data: {
                            tsetseMessage: diagnostic.messageText,
                        },
                    });
                }
            },
        };
    },
});
function logDebugNewProgram(fileName, program) {
    const configFilePath = program.getCompilerOptions().configFilePath;
    if (configFilePath) {
        logging_js_1.Logger.debug(`New program used for processing ${fileName} from config at ${configFilePath}`);
    }
    else {
        logging_js_1.Logger.debug(`New program used for processing ${fileName} using default project`);
    }
}
//# sourceMappingURL=trusted_types_checks.js.map