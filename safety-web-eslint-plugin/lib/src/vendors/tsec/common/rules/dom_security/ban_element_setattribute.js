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
exports.Rule = exports.BanSetAttributeRule = exports.TT_RELATED_ATTRIBUTES = void 0;
const allowlist_1 = require("../../third_party/tsetse/allowlist");
const error_code_1 = require("../../third_party/tsetse/error_code");
const rule_1 = require("../../third_party/tsetse/rule");
const ast_tools_1 = require("../../third_party/tsetse/util/ast_tools");
const is_literal_1 = require("../../third_party/tsetse/util/is_literal");
const property_matcher_1 = require("../../third_party/tsetse/util/property_matcher");
const ts = __importStar(require("typescript"));
const BANNED_APIS = [
    'Element.prototype.setAttribute',
    'Element.prototype.setAttributeNS',
    'Element.prototype.setAttributeNode',
    'Element.prototype.setAttributeNodeNS',
];
/**
 * Trusted Types related attribute names that should not be set through
 * `setAttribute` or similar functions.
 */
exports.TT_RELATED_ATTRIBUTES = new Set([
    'src',
    'srcdoc',
    'data',
    'codebase',
]);
/** A Rule that looks for use of Element#setAttribute and similar properties. */
class BanSetAttributeRule extends rule_1.AbstractRule {
    constructor(configuration) {
        super();
        this.code = error_code_1.ErrorCode.CONFORMANCE_PATTERN;
        this.propMatchers = BANNED_APIS.map(property_matcher_1.PropertyMatcher.fromSpec);
        if (configuration.allowlistEntries) {
            this.allowlist = new allowlist_1.Allowlist(configuration.allowlistEntries);
        }
    }
    /**
     * Check if the attribute name is a literal in a setAttribute call. We will
     * skip matching if the attribute name is not in the blocklist.
     */
    isCalledWithAllowedAttribute(typeChecker, node) {
        // The 'setAttribute' function expects exactly two arguments: an attribute
        // name and a value. It's OK if someone provided the wrong number of
        // arguments because the code will have other compiler errors.
        if (node.arguments.length !== 2)
            return true;
        return this.isAllowedAttribute(typeChecker, node.arguments[0]);
    }
    /**
     * Check if the attribute name is a literal and the namespace is null in a
     * setAttributeNS call. We will skip matching if the attribute name is not in
     * the blocklist.
     */
    isCalledWithAllowedAttributeNS(typeChecker, node) {
        // The 'setAttributeNS' function expects exactly three arguments: a
        // namespace, an attribute name and a value. It's OK if someone provided the
        // wrong number of arguments because the code will have other compiler
        // errors.
        if (node.arguments.length !== 3)
            return true;
        return (node.arguments[0].kind === ts.SyntaxKind.NullKeyword &&
            this.isAllowedAttribute(typeChecker, node.arguments[1]));
    }
    /**
     * Check if the attribute name is a literal that is not in the blocklist.
     */
    isAllowedAttribute(typeChecker, attr) {
        const attrType = typeChecker.getTypeAtLocation(attr);
        if (this.looseMatch) {
            return (attrType.isStringLiteral() &&
                !this.isSecuritySensitiveAttrName(attrType.value.toLowerCase()) &&
                (0, is_literal_1.isLiteral)(typeChecker, attr));
        }
        else {
            return (!attrType.isStringLiteral() ||
                !(0, is_literal_1.isLiteral)(typeChecker, attr) ||
                !this.isSecuritySensitiveAttrName(attrType.value.toLowerCase()));
        }
    }
    matchNode(tc, n, matcher) {
        if (!(0, ast_tools_1.shouldExamineNode)(n)) {
            return undefined;
        }
        if (!matcher.typeMatches(tc.getTypeAtLocation(n.expression))) {
            // Allowed: it is a different type.
            return undefined;
        }
        if (!ts.isCallExpression(n.parent)) {
            // Possibly not allowed: not calling it (may be renaming it).
            return this.looseMatch ? n : undefined;
        }
        if (n.parent.expression !== n) {
            // Possibly not allowed: calling a different function with it (may be
            // renaming it).
            return this.looseMatch ? n : undefined;
        }
        // If the matched node is a call to `setAttribute` (not setAttributeNS, etc)
        // and it's not setting a security sensitive attribute.
        if (matcher.bannedProperty === 'setAttribute') {
            const isAllowedAttr = this.isCalledWithAllowedAttribute(tc, n.parent);
            if (this.looseMatch) {
                // Allowed: it is not a security sensitive attribute.
                if (isAllowedAttr)
                    return undefined;
            }
            else {
                return isAllowedAttr ? undefined : n;
            }
        }
        // If the matched node is a call to `setAttributeNS` with a null namespace
        // and it's not setting a security sensitive attribute.
        if (matcher.bannedProperty === 'setAttributeNS') {
            const isAllowedAttr = this.isCalledWithAllowedAttributeNS(tc, n.parent);
            if (this.looseMatch) {
                // Allowed: it is not a security sensitive attribute.
                if (isAllowedAttr)
                    return undefined;
            }
            else {
                return isAllowedAttr ? undefined : n;
            }
        }
        return this.looseMatch ? n : undefined;
    }
    register(checker) {
        for (const matcher of this.propMatchers) {
            checker.onNamedPropertyAccess(matcher.bannedProperty, (c, n) => {
                const node = this.matchNode(c.typeChecker, n, matcher);
                if (node) {
                    checker.addFailureAtNode(node, this.errorMessage, this.ruleName, this.allowlist);
                }
            }, this.code);
            checker.onStringLiteralElementAccess(matcher.bannedProperty, (c, n) => {
                const node = this.matchNode(c.typeChecker, n, matcher);
                if (node) {
                    checker.addFailureAtNode(node, this.errorMessage, this.ruleName, this.allowlist);
                }
            }, this.code);
        }
    }
}
exports.BanSetAttributeRule = BanSetAttributeRule;
let errMsg = 'Do not use Element#setAttribute or similar APIs, as this can lead to XSS or cause Trusted Types violations.';
/** A Rule that looks for use of Element#setAttribute and similar properties. */
class Rule extends BanSetAttributeRule {
    constructor(configuration = {}) {
        super(configuration);
        this.ruleName = Rule.RULE_NAME;
        this.errorMessage = errMsg;
        this.isSecuritySensitiveAttrName = (attr) => (attr.startsWith('on') && attr !== 'on') || exports.TT_RELATED_ATTRIBUTES.has(attr);
        this.looseMatch = true;
    }
}
exports.Rule = Rule;
Rule.RULE_NAME = 'ban-element-setattribute';
//# sourceMappingURL=ban_element_setattribute.js.map