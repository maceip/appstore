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
exports.Rule = void 0;
const allowlist_1 = require("../../third_party/tsetse/allowlist");
const error_code_1 = require("../../third_party/tsetse/error_code");
const rule_1 = require("../../third_party/tsetse/rule");
const absolute_matcher_1 = require("../../third_party/tsetse/util/absolute_matcher");
const ast_tools_1 = require("../../third_party/tsetse/util/ast_tools");
const is_trusted_type_1 = require("../../third_party/tsetse/util/is_trusted_type");
const trusted_types_configuration_1 = require("../../third_party/tsetse/util/trusted_types_configuration");
const ts = __importStar(require("typescript"));
let errMsg = 'Constructing functions from strings can lead to XSS.';
/**
 * A Rule that looks for calls to the constructor of Function, either directly
 * or through Function.prototype.constructor.
 */
class Rule extends rule_1.AbstractRule {
    constructor(configuration = {}) {
        super();
        this.ruleName = Rule.RULE_NAME;
        this.code = error_code_1.ErrorCode.CONFORMANCE_PATTERN;
        this.allowTrustedTypes = true;
        this.nameMatcher = new absolute_matcher_1.AbsoluteMatcher('GLOBAL|Function');
        if (configuration === null || configuration === void 0 ? void 0 : configuration.allowlistEntries) {
            this.allowlist = new allowlist_1.Allowlist(configuration === null || configuration === void 0 ? void 0 : configuration.allowlistEntries);
        }
    }
    register(checker) {
        const check = (c, n) => {
            const node = this.checkNode(c.typeChecker, n, this.nameMatcher);
            if (node) {
                checker.addFailureAtNode(node, errMsg, Rule.RULE_NAME, this.allowlist);
            }
        };
        checker.onNamedIdentifier(this.nameMatcher.bannedName, check, this.code);
        checker.onStringLiteralElementAccess('Function', (c, n) => {
            check(c, n.argumentExpression);
        }, this.code);
    }
    checkNode(tc, n, matcher) {
        var _a;
        let matched = undefined;
        if (!(0, ast_tools_1.shouldExamineNode)(n))
            return;
        if (!matcher.matches(n, tc))
            return;
        if (!n.parent)
            return;
        // Function can be accessed through window or other globalThis objects
        // through the dot or bracket syntax. Check if we are seeing one of these
        // cases
        if ((ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) ||
            ts.isElementAccessExpression(n.parent)) {
            n = n.parent;
        }
        // Additionally cover the case `(Function)('bad script')`.
        // Note: there can be parentheses in every expression but we cann't afford
        // to check all of them. Leave other cases unchecked until we see real
        // bypasses.
        if (ts.isParenthesizedExpression(n.parent)) {
            n = n.parent;
        }
        const parent = n.parent;
        // Check if the matched node is part of a `new Function(string)` or
        // `Function(string)` expression
        if (ts.isNewExpression(parent) || ts.isCallExpression(parent)) {
            if (parent.expression === n && ((_a = parent.arguments) === null || _a === void 0 ? void 0 : _a.length)) {
                matched = parent;
            }
        }
        else {
            if (!parent.parent || !parent.parent.parent)
                return;
            // Check if the matched node is part of a
            // `Function.prototype.constructor(string)` expression.
            if (ts.isPropertyAccessExpression(parent) &&
                parent.name.text === 'prototype' &&
                ts.isPropertyAccessExpression(parent.parent) &&
                parent.parent.name.text === 'constructor' &&
                ts.isCallExpression(parent.parent.parent) &&
                parent.parent.parent.expression === parent.parent &&
                parent.parent.parent.arguments.length) {
                matched = parent.parent.parent;
            }
        }
        // If the constructor is called with TrustedScript arguments, do not flag it
        // (if the rule is confugired this way).
        if (matched &&
            this.allowTrustedTypes &&
            matched.arguments.every((arg) => (0, is_trusted_type_1.isExpressionOfAllowedTrustedType)(tc, arg, trusted_types_configuration_1.TRUSTED_SCRIPT))) {
            return;
        }
        return matched;
    }
}
exports.Rule = Rule;
Rule.RULE_NAME = 'ban-function-calls';
//# sourceMappingURL=ban_function_calls.js.map