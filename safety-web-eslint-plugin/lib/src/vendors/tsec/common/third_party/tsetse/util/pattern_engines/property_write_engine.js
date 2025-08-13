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
exports.PropertyWriteEngine = void 0;
exports.matchPropertyWrite = matchPropertyWrite;
const ts = __importStar(require("typescript"));
const ast_tools_1 = require("../ast_tools");
const is_trusted_type_1 = require("../is_trusted_type");
const property_engine_1 = require("./property_engine");
/** Test if an AST node is a matched property write. */
function matchPropertyWrite(tc, n, matcher) {
    (0, ast_tools_1.debugLog)(() => `inspecting ${n.parent.getText().trim()}`);
    if ((0, property_engine_1.matchProperty)(tc, n, matcher) === undefined)
        return;
    const assignment = n.parent;
    if (!ts.isBinaryExpression(assignment))
        return;
    // All properties we track are of the string type, so we only look at
    // `=` and `+=` operators.
    if (assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken &&
        assignment.operatorToken.kind !== ts.SyntaxKind.PlusEqualsToken) {
        return;
    }
    if (assignment.left !== n)
        return;
    return assignment;
}
/**
 * Checks whether the access expression is part of an assignment (write) to the
 * matched property and the type of the right hand side value is not of the
 * an allowed type.
 *
 * Returns `undefined` if the property write is allowed and the assignment node
 * if the assignment should trigger violation.
 */
function allowTrustedExpressionOnMatchedProperty(allowedType, tc, n, matcher) {
    const assignment = matchPropertyWrite(tc, n, matcher);
    if (!assignment)
        return;
    if (allowedType &&
        (0, is_trusted_type_1.isExpressionOfAllowedTrustedType)(tc, assignment.right, allowedType)) {
        return;
    }
    return assignment;
}
/**
 * The engine for BANNED_PROPERTY_WRITE. Bans assignments to the restricted
 * properties unless the right hand side of the assignment is of an allowed
 * type.
 */
class PropertyWriteEngine extends property_engine_1.PropertyEngine {
    register(checker) {
        this.registerWith(checker, (tc, n, m) => allowTrustedExpressionOnMatchedProperty(this.config.allowedTrustedType, tc, n, m));
    }
}
exports.PropertyWriteEngine = PropertyWriteEngine;
//# sourceMappingURL=property_write_engine.js.map