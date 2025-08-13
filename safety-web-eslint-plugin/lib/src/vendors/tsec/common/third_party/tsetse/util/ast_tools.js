"use strict";
/**
 * @fileoverview This is a collection of smaller utility functions to operate on
 * a TypeScript AST, used by JSConformance rules and elsewhere.
 */
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
exports.setDebug = setDebug;
exports.debugLog = debugLog;
exports.parents = parents;
exports.findInChildren = findInChildren;
exports.shouldExamineNode = shouldExamineNode;
exports.isInStockLibraries = isInStockLibraries;
exports.dealias = dealias;
exports.isPartOfTypeDeclaration = isPartOfTypeDeclaration;
exports.isAllowlistedNamedDeclaration = isAllowlistedNamedDeclaration;
exports.logASTWalkError = logASTWalkError;
const ts = __importStar(require("typescript"));
/**
 * Triggers increased verbosity in the rules.
 */
let DEBUG = false;
/**
 * Turns on or off logging for ConformancePatternRules.
 */
function setDebug(state) {
    DEBUG = state;
}
/**
 * Debug helper.
 */
function debugLog(msg) {
    if (DEBUG) {
        console.log(msg());
    }
}
/**
 * Returns `n`'s parents in order.
 */
function parents(n) {
    const p = [];
    while (n.parent) {
        n = n.parent;
        p.push(n);
    }
    return p;
}
/**
 * Searches for something satisfying the given test in `n` or its children.
 */
function findInChildren(n, test) {
    let toExplore = [n];
    let cur;
    while ((cur = toExplore.pop())) {
        if (test(cur)) {
            return true;
        }
        // Recurse
        toExplore = toExplore.concat(cur.getChildren());
    }
    return false;
}
function isOperandOfInstanceOf(n) {
    return ts.isBinaryExpression(n.parent) &&
        n.parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword;
}
/**
 * Returns true if the pattern-based Rule should look at that node and consider
 * warning there.
 */
function shouldExamineNode(n) {
    return !((n.parent && ts.isTypeNode(n.parent)) || isOperandOfInstanceOf(n) ||
        ts.isTypeOfExpression(n.parent) || isInStockLibraries(n));
}
/**
 * Return whether the given Node is (or is in) a library included as default.
 * We currently look for a node_modules/typescript/ prefix, but this could
 * be expanded if needed.
 */
function isInStockLibraries(n) {
    const sourceFile = ts.isSourceFile(n) ? n : n.getSourceFile();
    if (sourceFile) {
        return sourceFile.fileName.indexOf('node_modules/typescript/') !== -1;
    }
    else {
        // the node is nowhere? Consider it as part of the core libs: we can't
        // do anything with it anyways, and it was likely included as default.
        return true;
    }
}
/**
 * Turns the given Symbol into its non-aliased version (which could be itself).
 * Returns undefined if given an undefined Symbol (so you can call
 * `dealias(typeChecker.getSymbolAtLocation(node))`).
 */
function dealias(symbol, tc) {
    if (!symbol) {
        return undefined;
    }
    if (symbol.getFlags() & ts.SymbolFlags.Alias) {
        // Note: something that has only TypeAlias is not acceptable here.
        return dealias(tc.getAliasedSymbol(symbol), tc);
    }
    return symbol;
}
/**
 * Returns whether `n`'s parents are something indicating a type.
 */
function isPartOfTypeDeclaration(n) {
    return [n, ...parents(n)].some(p => p.kind === ts.SyntaxKind.TypeReference ||
        p.kind === ts.SyntaxKind.TypeLiteral);
}
/**
 * Returns whether `n` is a declared name on which we do not intend to emit
 * errors.
 */
function isAllowlistedNamedDeclaration(n) {
    return ts.isVariableDeclaration(n) || ts.isClassDeclaration(n) ||
        ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) ||
        ts.isPropertyDeclaration(n) || ts.isInterfaceDeclaration(n) ||
        ts.isTypeAliasDeclaration(n) || ts.isEnumDeclaration(n) ||
        ts.isModuleDeclaration(n) || ts.isImportEqualsDeclaration(n) ||
        ts.isExportDeclaration(n) || ts.isMissingDeclaration(n) ||
        ts.isImportClause(n) || ts.isExportSpecifier(n) ||
        ts.isImportSpecifier(n);
}
/**
 * If verbose, logs the given error that happened while walking n, with a
 * stacktrace.
 */
function logASTWalkError(verbose, n, e) {
    let nodeText = `[error getting name for ${JSON.stringify(n)}]`;
    try {
        nodeText = '"' + n.getFullText().trim() + '"';
    }
    catch (_a) {
    }
    debugLog(() => `Walking node ${nodeText} failed with error ${e}.\n` +
        `Stacktrace:\n${e.stack}`);
}
//# sourceMappingURL=ast_tools.js.map