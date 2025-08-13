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
const ast_tools_1 = require("../../third_party/tsetse/util/ast_tools");
const is_literal_1 = require("../../third_party/tsetse/util/is_literal");
const property_matcher_1 = require("../../third_party/tsetse/util/property_matcher");
const ts = __importStar(require("typescript"));
let errMsg = "Do not use document.execCommand('insertHTML'), as this can lead to XSS.";
function matchNode(tc, n, matcher) {
    if (!(0, ast_tools_1.shouldExamineNode)(n))
        return;
    if (!matcher.typeMatches(tc.getTypeAtLocation(n.expression)))
        return;
    // Check if the matched node is a call to `execCommand` and if the command
    // name is a literal. We will skip matching if the command name is not in
    // the blocklist.
    if (!ts.isCallExpression(n.parent))
        return;
    if (n.parent.expression !== n)
        return;
    // It's OK if someone provided the wrong number of arguments because the code
    // will have other compiler errors.
    if (n.parent.arguments.length < 1)
        return;
    const ty = tc.getTypeAtLocation(n.parent.arguments[0]);
    if (ty.isStringLiteral() &&
        ty.value.toLowerCase() !== 'inserthtml' &&
        (0, is_literal_1.isLiteral)(tc, n.parent.arguments[0])) {
        return;
    }
    return n;
}
/** A Rule that looks for use of Document#execCommand. */
class Rule extends rule_1.AbstractRule {
    constructor(configuration = {}) {
        super();
        this.ruleName = Rule.RULE_NAME;
        this.code = error_code_1.ErrorCode.CONFORMANCE_PATTERN;
        this.propMatcher = property_matcher_1.PropertyMatcher.fromSpec('Document.prototype.execCommand');
        if (configuration.allowlistEntries) {
            this.allowlist = new allowlist_1.Allowlist(configuration.allowlistEntries);
        }
    }
    register(checker) {
        checker.onNamedPropertyAccess(this.propMatcher.bannedProperty, (c, n) => {
            const node = matchNode(c.typeChecker, n, this.propMatcher);
            if (node) {
                checker.addFailureAtNode(node, errMsg, Rule.RULE_NAME, this.allowlist);
            }
        }, this.code);
        checker.onStringLiteralElementAccess(this.propMatcher.bannedProperty, (c, n) => {
            const node = matchNode(c.typeChecker, n, this.propMatcher);
            if (node) {
                checker.addFailureAtNode(node, errMsg, Rule.RULE_NAME, this.allowlist);
            }
        }, this.code);
    }
}
exports.Rule = Rule;
Rule.RULE_NAME = 'ban-document-execcommand';
//# sourceMappingURL=ban_document_execcommand.js.map