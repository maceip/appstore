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
/**
 * @fileoverview Turn on a TS security checker to ban setInverval and setTimeout
 * when they are called to evaluate strings as scripts.
 *
 * Unlike other rules that only look at the property/name, this rule checks if
 * the functions are called with strings as the first argument. Therefore, none
 * of the pattern engines directly applies to this rule. We could have used
 * BANNED_NAME and BANNED_PROPERTY like we did for open and eval, but it causes
 * too many false positives in this case.
 */
const allowlist_1 = require("../../third_party/tsetse/allowlist");
const error_code_1 = require("../../third_party/tsetse/error_code");
const rule_1 = require("../../third_party/tsetse/rule");
const absolute_matcher_1 = require("../../third_party/tsetse/util/absolute_matcher");
const ast_tools_1 = require("../../third_party/tsetse/util/ast_tools");
const is_trusted_type_1 = require("../../third_party/tsetse/util/is_trusted_type");
const property_matcher_1 = require("../../third_party/tsetse/util/property_matcher");
const trusted_types_configuration_1 = require("../../third_party/tsetse/util/trusted_types_configuration");
const ts = __importStar(require("typescript"));
const BANNED_NAMES = ['GLOBAL|setInterval', 'GLOBAL|setTimeout'];
const BANNED_PROPERTIES = [
    'Window.prototype.setInterval',
    'Window.prototype.setTimeout',
];
function formatErrorMessage(bannedEntity) {
    let errMsg = `Do not use ${bannedEntity}, as calling it with a string argument can cause code-injection security vulnerabilities.`;
    return errMsg;
}
/**
 * Checks if the APIs are called with functions (that
 * won't trigger an eval-like effect) or a TrustedScript value if Trusted Types
 * are enabled (and it's up to the developer to make sure it
 * the value can't be misused). These patterns are safe to use, so we want to
 * exclude them from the reported errors.
 */
function isUsedWithNonStringArgument(n, tc) {
    const par = n.parent;
    // Early return on pattern like `const st = setTimeout;` We now consider this
    // pattern acceptable to reduce false positives.
    if (!ts.isCallExpression(par) || par.expression !== n)
        return true;
    // Having zero arguments will trigger other compiler errors. We should not
    // bother emitting a Tsetse error.
    if (par.arguments.length === 0)
        return true;
    const firstArgType = tc.getTypeAtLocation(par.arguments[0]);
    const isFirstArgNonString = (firstArgType.flags &
        (ts.TypeFlags.String |
            ts.TypeFlags.StringLike |
            ts.TypeFlags.StringLiteral)) ===
        0;
    if ((0, is_trusted_type_1.isExpressionOfAllowedTrustedType)(tc, par.arguments[0], trusted_types_configuration_1.TRUSTED_SCRIPT)) {
        return true;
    }
    return isFirstArgNonString;
}
function isBannedStringLiteralAccess(n, tc, propMatcher) {
    const argExp = n.argumentExpression;
    return (propMatcher.typeMatches(tc.getTypeAtLocation(n.expression)) &&
        ts.isStringLiteralLike(argExp) &&
        argExp.text === propMatcher.bannedProperty);
}
function checkNode(tc, n, matcher) {
    if (!(0, ast_tools_1.shouldExamineNode)(n))
        return;
    // TODO: go/ts54upgrade - Auto-added to unblock TS5.4 migration.
    // TS2345: Argument of type 'T' is not assignable to parameter of type 'never'.
    // @ts-ignore
    if (!matcher.matches(n, tc))
        return;
    if (isUsedWithNonStringArgument(n, tc))
        return;
    return n;
}
/**
 * A rule that checks the uses of Window#setTimeout and Window#setInterval
 * properties; it also checks the global setTimeout and setInterval functions.
 */
class Rule extends rule_1.AbstractRule {
    constructor(configuration = {}) {
        super();
        this.ruleName = Rule.RULE_NAME;
        this.code = error_code_1.ErrorCode.CONFORMANCE_PATTERN;
        this.nameMatchers = BANNED_NAMES.map((name) => new absolute_matcher_1.AbsoluteMatcher(name));
        this.propMatchers = BANNED_PROPERTIES.map(property_matcher_1.PropertyMatcher.fromSpec);
        if (configuration === null || configuration === void 0 ? void 0 : configuration.allowlistEntries) {
            this.allowlist = new allowlist_1.Allowlist(configuration === null || configuration === void 0 ? void 0 : configuration.allowlistEntries);
        }
    }
    register(checker) {
        // Check global names
        for (const nameMatcher of this.nameMatchers) {
            checker.onNamedIdentifier(nameMatcher.bannedName, (c, n) => {
                // window.id is automatically resolved to id, so the matcher will be
                // able to match it. But we don't want redundant errors. Skip the
                // node if it is part of a property access expression.
                if (ts.isPropertyAccessExpression(n.parent))
                    return;
                if (ts.isQualifiedName(n.parent))
                    return;
                const node = checkNode(c.typeChecker, n, nameMatcher);
                if (node) {
                    checker.addFailureAtNode(node, formatErrorMessage(nameMatcher.bannedName), Rule.RULE_NAME, this.allowlist);
                }
            }, this.code);
        }
        // Check properties
        for (const propMatcher of this.propMatchers) {
            checker.onNamedPropertyAccess(propMatcher.bannedProperty, (c, n) => {
                const node = checkNode(c.typeChecker, n, propMatcher);
                if (node) {
                    checker.addFailureAtNode(node, formatErrorMessage(`${propMatcher.bannedType}#${propMatcher.bannedProperty}`), Rule.RULE_NAME, this.allowlist);
                }
            }, this.code);
            checker.onStringLiteralElementAccess(propMatcher.bannedProperty, (c, n) => {
                const node = checkNode(c.typeChecker, n, {
                    matches: () => isBannedStringLiteralAccess(n, c.typeChecker, propMatcher),
                });
                if (node) {
                    checker.addFailureAtNode(node, formatErrorMessage(`${propMatcher.bannedType}#${propMatcher.bannedProperty}`), Rule.RULE_NAME, this.allowlist);
                }
            }, this.code);
        }
    }
}
exports.Rule = Rule;
Rule.RULE_NAME = 'ban-window-stringfunctiondef';
//# sourceMappingURL=ban_window_stringfunctiondef.js.map