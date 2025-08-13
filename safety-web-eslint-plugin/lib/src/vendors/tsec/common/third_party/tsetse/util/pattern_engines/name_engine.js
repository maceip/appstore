"use strict";
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
exports.ImportedNameEngine = exports.NameEngine = void 0;
const ts = __importStar(require("typescript"));
const absolute_matcher_1 = require("../absolute_matcher");
const is_trusted_type_1 = require("../is_trusted_type");
const pattern_engine_1 = require("./pattern_engine");
function isCalledWithAllowedTrustedType(tc, n, allowedTrustedType) {
    const par = n.parent;
    if (allowedTrustedType && ts.isCallExpression(par) &&
        par.arguments.length > 0 &&
        (0, is_trusted_type_1.isExpressionOfAllowedTrustedType)(tc, par.arguments[0], allowedTrustedType)) {
        return true;
    }
    return false;
}
function isPolyfill(n, matcher) {
    if (matcher.filePath === 'GLOBAL') {
        const parent = n.parent;
        if (parent && ts.isBinaryExpression(parent) && parent.left === n &&
            parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            return true;
        }
    }
    return false;
}
function checkIdentifierNode(tc, n, matcher, allowedTrustedType) {
    const wholeExp = ts.isPropertyAccessExpression(n.parent) ? n.parent : n;
    if (isPolyfill(wholeExp, matcher))
        return;
    if (!matcher.matches(n, tc))
        return;
    if (isCalledWithAllowedTrustedType(tc, n, allowedTrustedType))
        return;
    return wholeExp;
}
function checkElementAccessNode(tc, n, matcher, allowedTrustedType) {
    if (isPolyfill(n, matcher))
        return;
    if (!matcher.matches(n.argumentExpression, tc))
        return;
    if (isCalledWithAllowedTrustedType(tc, n, allowedTrustedType))
        return;
    return n;
}
/** Engine for the BANNED_NAME pattern */
class NameEngine extends pattern_engine_1.PatternEngine {
    constructor() {
        super(...arguments);
        this.banImport = false;
    }
    register(checker) {
        for (const value of this.config.values) {
            const matcher = new absolute_matcher_1.AbsoluteMatcher(value, this.banImport);
            // `String.prototype.split` only returns emtpy array when both the
            // string and the splitter are empty. Here we should be able to safely
            // assert pop returns a non-null result.
            const bannedIdName = matcher.bannedName.split('.').pop();
            checker.onNamedIdentifier(bannedIdName, this.wrapCheckWithAllowlistingAndFixer((tc, n) => checkIdentifierNode(tc, n, matcher, this.config.allowedTrustedType)), this.config.errorCode);
            // `checker.onNamedIdentifier` will not match the node if it is accessed
            // using property access expression (e.g. window['eval']).
            // We already found examples on how developers misuse this limitation
            // internally.
            //
            // This engine is inteded to ban global name identifiers, but even these
            // can be property accessed using `globalThis` or `window`.
            checker.onStringLiteralElementAccess(bannedIdName, this.wrapCheckWithAllowlistingAndFixer((tc, n) => checkElementAccessNode(tc, n, matcher, this.config.allowedTrustedType)), this.config.errorCode);
        }
    }
}
exports.NameEngine = NameEngine;
/** Engine for the BANNED_IMPORTED_NAME pattern */
class ImportedNameEngine extends NameEngine {
    constructor() {
        super(...arguments);
        this.banImport = true;
    }
}
exports.ImportedNameEngine = ImportedNameEngine;
//# sourceMappingURL=name_engine.js.map