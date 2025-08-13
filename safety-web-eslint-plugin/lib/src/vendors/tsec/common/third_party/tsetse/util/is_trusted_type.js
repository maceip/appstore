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
exports.isExpressionOfAllowedTrustedType = isExpressionOfAllowedTrustedType;
const ts = __importStar(require("typescript"));
const ast_tools_1 = require("./ast_tools");
/**
 * Returns true if the AST expression is Trusted Types compliant and can be
 * safely used in the sink.
 *
 * This function is only called if the rule is configured to allow specific
 * Trusted Type value in the assignment.
 */
function isExpressionOfAllowedTrustedType(tc, expr, allowedType) {
    if (isTrustedType(tc, expr, allowedType))
        return true;
    if (isTrustedTypeCastToUnknownToString(tc, expr, allowedType))
        return true;
    if (isTrustedTypeUnionWithStringCastToString(tc, expr, allowedType))
        return true;
    if (isTrustedTypeUnwrapperFunction(tc, expr, allowedType))
        return true;
    return false;
}
/**
 * Helper function which checks if given TS Symbol is allowed (matches
 * configured Trusted Type).
 */
function isAllowedSymbol(tc, symbol, allowedType, allowAmbientTrustedTypesDeclaration) {
    (0, ast_tools_1.debugLog)(() => `isAllowedSymbol called with symbol ${symbol === null || symbol === void 0 ? void 0 : symbol.getName()}`);
    if (!symbol)
        return false;
    const fqn = tc.getFullyQualifiedName(symbol);
    (0, ast_tools_1.debugLog)(() => `fully qualified name is ${fqn}`);
    if (allowAmbientTrustedTypesDeclaration &&
        allowedType.allowAmbientTrustedTypesDeclaration &&
        fqn === allowedType.typeName) {
        return true;
    }
    if (!fqn.endsWith('.' + allowedType.typeName))
        return false;
    // check that the type is comes allowed declaration file
    const declarations = symbol.getDeclarations();
    if (!declarations)
        return false;
    const declarationFileNames = declarations.map(d => { var _a; return (_a = d.getSourceFile()) === null || _a === void 0 ? void 0 : _a.fileName; });
    (0, ast_tools_1.debugLog)(() => `got declaration filenames ${declarationFileNames}`);
    return declarationFileNames.some(fileName => fileName.includes(allowedType.modulePathMatcher));
}
/**
 * Returns true if the expression matches the following format:
 * "AllowedTrustedType as unknown as string"
 */
function isTrustedTypeCastToUnknownToString(tc, expr, allowedType) {
    // check if the expression is a cast expression to string
    if (!ts.isAsExpression(expr) ||
        expr.type.kind !== ts.SyntaxKind.StringKeyword) {
        return false;
    }
    // inner expression should be another cast expression
    const innerExpr = expr.expression;
    if (!ts.isAsExpression(innerExpr) ||
        innerExpr.type.kind !== ts.SyntaxKind.UnknownKeyword) {
        return false;
    }
    // check if left side of the cast expression is of an allowed type.
    const castSource = innerExpr.expression;
    (0, ast_tools_1.debugLog)(() => `looking at cast source ${castSource.getText()}`);
    return isAllowedSymbol(tc, tc.getTypeAtLocation(castSource).getSymbol(), allowedType, false);
}
/**
 * Returns true if the expression matches the following format:
 * "(AllowedTrustedType | string) as string"
 */
function isTrustedTypeUnionWithStringCastToString(tc, expr, allowedType) {
    // verify that the expression is a cast expression to string
    if (!ts.isAsExpression(expr) ||
        expr.type.kind !== ts.SyntaxKind.StringKeyword) {
        return false;
    }
    // inner expression needs to be a type union of trusted value
    const innerExprType = tc.getTypeAtLocation(expr.expression);
    return innerExprType.isUnion() &&
        // do not care how many types are in the union. As long as one of them is
        // the configured Trusted type we are happy.
        innerExprType.types.some(type => isAllowedSymbol(tc, type.getSymbol(), allowedType, false));
}
/**
 * Returns true if the expression is a function call of the following signature:
 * "(TypeCompatibleWithTrustedType): string"
 *
 * where `TypeCompatibleWithTrustedType` can be either the Trusted Type itself
 * or a TS union. We only require the first argument of the call site to be
 * exact Trusted Type. Pattern like `unwrap('err msg', TT)` will not work.
 * We intentionally want make the unwrapper pattern more apparent by forcing the
 * TT value in the first argument.
 */
function isTrustedTypeUnwrapperFunction(tc, expr, allowedType) {
    if (!ts.isCallExpression(expr))
        return false;
    return expr.arguments.length > 0 &&
        isAllowedSymbol(tc, tc.getTypeAtLocation(expr.arguments[0]).getSymbol(), allowedType, false);
}
/**
 * Returns true if the expression is a value of Trusted Types, or a type that is
 * the intersection of Trusted Types and other types.
 */
function isTrustedType(tc, expr, allowedType) {
    const type = tc.getTypeAtLocation(expr);
    if (isAllowedSymbol(tc, type.getSymbol(), allowedType, true))
        return true;
    if (!type.isIntersection())
        return false;
    return type.types.some(t => isAllowedSymbol(tc, t.getSymbol(), allowedType, true));
}
//# sourceMappingURL=is_trusted_type.js.map