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
exports.buildReplacementFixer = buildReplacementFixer;
exports.maybeAddNamedImport = maybeAddNamedImport;
exports.maybeAddNamespaceImport = maybeAddNamespaceImport;
const ts = __importStar(require("typescript"));
const ast_tools_1 = require("./ast_tools");
/**
 * A simple Fixer builder based on a function that looks at a node, and
 * output either nothing, or a replacement. If this is too limiting, implement
 * Fixer instead.
 */
function buildReplacementFixer(potentialReplacementGenerator) {
    return {
        getFixForFlaggedNode: (n) => {
            const partialFix = potentialReplacementGenerator(n);
            if (!partialFix) {
                return;
            }
            return {
                changes: [{
                        sourceFile: n.getSourceFile(),
                        start: n.getStart(),
                        end: n.getEnd(),
                        replacement: partialFix.replaceWith,
                    }],
            };
        }
    };
}
/**
 * Builds an IndividualChange that imports the required symbol from the given
 * file under the given name. This might reimport the same thing twice in some
 * cases, but it will always make it available under the right name (though
 * its name might collide with other imports, as we don't currently check for
 * that).
 */
function maybeAddNamedImport(source, importWhat, fromModule, importAs, tazeComment) {
    const importStatements = source.statements.filter(ts.isImportDeclaration);
    const importSpecifier = importAs ? `${importWhat} as ${importAs}` : importWhat;
    // See if the original code already imported something from the right file
    const importFromRightModule = importStatements
        .map(maybeParseImportNode)
        // Exclude undefined
        .filter((binding) => binding !== undefined)
        // Exclude wildcard import
        .filter((binding) => ts.isNamedImports(binding.namedBindings))
        // Exlcude imports from the wrong file
        .find(binding => binding.fromModule === fromModule);
    if (importFromRightModule) {
        const foundRightImport = importFromRightModule.namedBindings.elements.some(iSpec => iSpec.propertyName ?
            iSpec.name.getText() === importAs && // import {foo as bar}
                iSpec.propertyName.getText() === importWhat :
            iSpec.name.getText() === importWhat); // import {foo}
        if (!foundRightImport) {
            // Insert our symbol in the list of imports from that file.
            (0, ast_tools_1.debugLog)(() => `No named imports from that file, generating new fix`);
            return {
                start: importFromRightModule.namedBindings.elements[0].getStart(),
                end: importFromRightModule.namedBindings.elements[0].getStart(),
                sourceFile: source,
                replacement: `${importSpecifier}, `,
            };
        }
        return; // Our request is already imported under the right name.
    }
    // If we get here, we didn't find anything imported from the wanted file, so
    // we'll need the full import string. Add it after the last import,
    // and let clang-format handle the rest.
    const newImportStatement = `import {${importSpecifier}} from '${fromModule}';` +
        (tazeComment ? `  ${tazeComment}\n` : `\n`);
    const insertionPosition = importStatements.length ?
        importStatements[importStatements.length - 1].getEnd() + 1 :
        0;
    return {
        start: insertionPosition,
        end: insertionPosition,
        sourceFile: source,
        replacement: newImportStatement,
    };
}
/**
 * Builds an IndividualChange that imports the required namespace from the given
 * file under the given name. This might reimport the same thing twice in some
 * cases, but it will always make it available under the right name (though
 * its name might collide with other imports, as we don't currently check for
 * that).
 */
function maybeAddNamespaceImport(source, fromModule, importAs, tazeComment) {
    const importStatements = source.statements.filter(ts.isImportDeclaration);
    const hasTheRightImport = importStatements
        .map(maybeParseImportNode)
        // Exclude undefined
        .filter((binding) => binding !== undefined)
        // Exlcude named imports
        .filter((binding) => ts.isNamespaceImport(binding.namedBindings))
        .some(binding => binding.fromModule === fromModule &&
        binding.namedBindings.name.getText() === importAs);
    if (!hasTheRightImport) {
        const insertionPosition = importStatements.length ?
            importStatements[importStatements.length - 1].getEnd() + 1 :
            0;
        return {
            start: insertionPosition,
            end: insertionPosition,
            sourceFile: source,
            replacement: tazeComment ?
                `import * as ${importAs} from '${fromModule}';  ${tazeComment}\n` :
                `import * as ${importAs} from '${fromModule}';\n`,
        };
    }
    return;
}
/**
 * This tries to make sense of an ImportDeclaration, and returns the
 * interesting parts, undefined if the import declaration is valid but not
 * understandable by the checker.
 */
function maybeParseImportNode(iDecl) {
    if (!iDecl.importClause) {
        // something like import "./file";
        (0, ast_tools_1.debugLog)(() => `Ignoring import without imported symbol: ${iDecl.getFullText()}`);
        return;
    }
    if (iDecl.importClause.name || !iDecl.importClause.namedBindings) {
        // Seems to happen in defaults imports like import Foo from 'Bar'.
        // Not much we can do with that when trying to get a hold of some
        // symbols, so just ignore that line (worst case, we'll suggest another
        // import style).
        (0, ast_tools_1.debugLog)(() => `Ignoring import: ${iDecl.getFullText()}`);
        return;
    }
    if (!ts.isStringLiteral(iDecl.moduleSpecifier)) {
        (0, ast_tools_1.debugLog)(() => `Ignoring import whose module specifier is not literal`);
        return;
    }
    return {
        namedBindings: iDecl.importClause.namedBindings,
        fromModule: iDecl.moduleSpecifier.text
    };
}
//# sourceMappingURL=fixer.js.map