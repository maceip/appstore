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
exports.Rule = void 0;
const ts = __importStar(require("typescript"));
const error_code_1 = require("../error_code");
const rule_1 = require("../rule");
function checkImport(checker, node) {
    // Check only side-effect imports as other imports are checked by TSC.
    if (node.importClause !== undefined)
        return;
    const modSpec = node.moduleSpecifier;
    if (!modSpec)
        return;
    // Code with syntax errors can cause moduleSpecifier to be something other
    // than a string literal. Early return to avoid a crash when
    // `moduleSpecifier.name` is undefined.
    if (!ts.isStringLiteral(modSpec))
        return;
    const sym = checker.typeChecker.getSymbolAtLocation(modSpec);
    if (sym)
        return;
    // It is possible that getSymbolAtLocation returns undefined, but module name
    // is actually resolvable - e.g. when the imported file is empty (i.e. it is a
    // script, not a module). Therefore we have to check with resolveModuleName.
    const modName = modSpec.text;
    const source = node.getSourceFile();
    const resolvingResult = checker.resolveModuleName(modName, source);
    if (resolvingResult && resolvingResult.resolvedModule)
        return;
    checker.addFailureAtNode(node, `Cannot find module`, /*source=*/ undefined, 
    /*allowlist*/ undefined);
}
/**
 * Checks side effects imports and adds failures on module resolution errors.
 * This is an equivalent of the TS2307 error, but for side effects imports.
 */
class Rule extends rule_1.AbstractRule {
    constructor() {
        super(...arguments);
        this.ruleName = Rule.RULE_NAME;
        this.code = error_code_1.ErrorCode.BAD_SIDE_EFFECT_IMPORT;
    }
    register(checker) {
        checker.on(ts.SyntaxKind.ImportDeclaration, checkImport, this.code);
    }
}
exports.Rule = Rule;
Rule.RULE_NAME = 'check-imports';
//# sourceMappingURL=check_side_effect_import_rule.js.map