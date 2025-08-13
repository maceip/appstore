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
exports.AbsoluteMatcher = void 0;
const ts = __importStar(require("typescript"));
const ast_tools_1 = require("./ast_tools");
const PATH_NAME_FORMAT = '[/\\.\\w\\d_\\-$]+';
const JS_IDENTIFIER_FORMAT = '[\\w\\d_\\-$]+';
const FQN_FORMAT = `(${JS_IDENTIFIER_FORMAT}.)*${JS_IDENTIFIER_FORMAT}`;
const GLOBAL = 'GLOBAL';
const ANY_SYMBOL = 'ANY_SYMBOL';
const CLOSURE = 'CLOSURE';
/** A fqn made out of a dot-separated chain of JS identifiers. */
const ABSOLUTE_RE = new RegExp(`^${PATH_NAME_FORMAT}\\|${FQN_FORMAT}$`);
/**
 * Clutz glues js symbols to ts namespace by prepending "ಠ_ಠ.clutz.".
 * We need to include this prefix when the banned name is from Closure.
 */
const CLUTZ_SYM_PREFIX = 'ಠ_ಠ.clutz.';
/**
 * This class matches symbols given a "foo.bar.baz" name, where none of the
 * steps are instances of classes.
 *
 * Note that this isn't smart about subclasses and types: to write a check, we
 * strongly suggest finding the expected symbol in externs to find the object
 * name on which the symbol was initially defined.
 *
 * This matcher requires a scope for the symbol, which may be `GLOBAL`,
 * `ANY_SYMBOL`, `CLOSURE` or a file path filter. `CLOSURE` indicates that the
 * symbol is from the JS Closure library processed by clutz. The matcher begins
 * with this scope, then the separator "|", followed by the symbol name. For
 * example, "GLOBAL|eval".
 *
 * The file filter specifies
 * (part of) the path of the file in which the symbol of interest is defined.
 * For example, "path/to/file.ts|foo.bar.baz".
 * With this filter, only symbols named "foo.bar.baz" that are defined in a path
 * that contains "path/to/file.ts" are matched.
 *
 * This filter is useful when mutiple symbols have the same name but
 * you want to match with a specific one. For example, assume that there are
 * two classes named "Foo" defined in /path/to/file0 and /path/to/file1.
 * // in /path/to/file0
 * export class Foo { static bar() {return "Foo.bar in file0";} }
 *
 * // in /path/to/file1
 * export class Foo { static bar() {return "Foo.bar in file1";} }
 *
 * Suppose that these two classes are referenced in two other files.
 * // in /path/to/file2
 * import {Foo} from /path/to/file0;
 * Foo.bar();
 *
 * // in /path/to/file3
 * import {Foo} from /path/to/file1;
 * Foo.bar();
 *
 * An absolute matcher "Foo.bar" without a file filter will match with both
 * references to "Foo.bar" in /path/to/file2 and /path/to/file3.
 * An absolute matcher "/path/to/file1|Foo.bar", however, only matches with the
 * "Foo.bar()" in /path/to/file3 because that references the "Foo.bar" defined
 * in /path/to/file1.
 *
 * Note that an absolute matcher will match with any reference to the symbol
 * defined in the file(s) specified by the file filter. For example, assume that
 * Foo from file1 is extended in file4.
 *
 * // in /path/to/file4
 * import {Foo} from /path/to/file1;
 * class Moo extends Foo { static tar() {return "Moo.tar in file4";} }
 * Moo.bar();
 *
 * An absolute matcher "/path/to/file1|Foo.bar" matches with "Moo.bar()" because
 * "bar" is defined as part of Foo in /path/to/file1.
 *
 * By default, the matcher won't match symbols in import statements if the
 * symbol is not renamed. Machers can be optionally configured symbols in import
 * statements even if it's not a named import.
 */
class AbsoluteMatcher {
    constructor(spec, matchImport = false) {
        this.matchImport = matchImport;
        if (!spec.match(ABSOLUTE_RE)) {
            throw new Error('Malformed matcher selector.');
        }
        // JSConformance used to use a Foo.prototype.bar syntax for bar on
        // instances of Foo. TS doesn't surface the prototype part in the FQN, and
        // so you can't tell static `bar` on `foo` from the `bar` property/method
        // on `foo`. To avoid any confusion, throw there if we see `prototype` in
        // the spec: that way, it's obvious that you're not trying to match
        // properties.
        if (spec.match('.prototype.')) {
            throw new Error('Your pattern includes a .prototype, but the AbsoluteMatcher is ' +
                'meant for non-object matches. Use the PropertyMatcher instead, or ' +
                'the Property-based PatternKinds.');
        }
        // Split spec by the separator "|".
        [this.filePath, this.bannedName] = spec.split('|', 2);
        if (this.filePath === CLOSURE) {
            this.bannedName = CLUTZ_SYM_PREFIX + this.bannedName;
        }
    }
    matches(n, tc) {
        const p = n.parent;
        (0, ast_tools_1.debugLog)(() => `start matching ${n.getText()} in ${p === null || p === void 0 ? void 0 : p.getText()}`);
        if (p !== undefined) {
            // Check if the node is being declared. Declaration may be imported
            // without programmer being aware of. We should not alert them about that.
            // Since import statments are also declarations, this has two notable
            // consequences.
            // - Match is negative for imports without renaming
            // - Match is positive for imports with renaming, when the imported name
            //   is the target. Since Tsetse is flow insensitive and we don't track
            //   symbol aliases, the import statement is the only place we can match
            //   bad symbols if they get renamed.
            if ((0, ast_tools_1.isAllowlistedNamedDeclaration)(p) && p.name === n) {
                if (!this.matchImport || !ts.isImportSpecifier(p)) {
                    return false;
                }
            }
        }
        // Get the symbol (or the one at the other end of this alias) that we're
        // looking at.
        const s = (0, ast_tools_1.dealias)(tc.getSymbolAtLocation(n), tc);
        if (!s) {
            (0, ast_tools_1.debugLog)(() => `cannot get symbol`);
            return (this.filePath === GLOBAL && matchGoogGlobal(n, this.bannedName, tc));
        }
        // The TS-provided FQN tells us the full identifier, and the origin file
        // in some circumstances.
        const fqn = tc.getFullyQualifiedName(s);
        (0, ast_tools_1.debugLog)(() => `got FQN ${fqn}`);
        // Name-based check: `getFullyQualifiedName` returns `"filename".foo.bar` or
        // just `foo.bar` if the symbol is ambient. The check here should consider
        // both cases.
        if (!fqn.endsWith('".' + this.bannedName) && fqn !== this.bannedName) {
            (0, ast_tools_1.debugLog)(() => `FQN ${fqn} doesn't match name ${this.bannedName}`);
            return false;
        }
        // If `ANY_SYMBOL` or `CLOSURE` is specified, it's sufficient to conclude we
        // have a match.
        if (this.filePath === ANY_SYMBOL || this.filePath === CLOSURE) {
            return true;
        }
        // If there is no declaration, the symbol is a language built-in object.
        // This is a match only if `GLOBAL` is specified.
        const declarations = s.getDeclarations();
        if (declarations === undefined) {
            return this.filePath === GLOBAL;
        }
        // No file info in the FQN means it's imported from a .d.ts declaration
        // file. This can be from a core library, a JS library, or an exported local
        // symbol defined in another TS target. We need to extract the name of the
        // declaration file.
        if (!fqn.startsWith('"')) {
            if (this.filePath === GLOBAL) {
                return declarations.some(ast_tools_1.isInStockLibraries);
            }
            else {
                return declarations.some((d) => {
                    var _a;
                    const srcFilePath = (_a = d.getSourceFile()) === null || _a === void 0 ? void 0 : _a.fileName;
                    return srcFilePath && srcFilePath.match(this.filePath);
                });
            }
        }
        else {
            const last = fqn.indexOf('"', 1);
            if (last === -1) {
                throw new Error('Malformed fully-qualified name.');
            }
            const filePath = fqn.substring(1, last);
            return filePath.match(this.filePath) !== null;
        }
    }
}
exports.AbsoluteMatcher = AbsoluteMatcher;
function matchGoogGlobal(n, bannedName, tc) {
    if (n.parent === undefined)
        return false;
    let accessExpr = n.parent;
    const ids = bannedName.split('.').reverse();
    for (const id of ids) {
        let memberName;
        if (ts.isPropertyAccessExpression(accessExpr)) {
            memberName = accessExpr.name.text;
            accessExpr = accessExpr.expression;
        }
        else if (ts.isElementAccessExpression(accessExpr)) {
            const argType = tc.getTypeAtLocation(accessExpr.argumentExpression);
            if (argType.isStringLiteral()) {
                memberName = argType.value;
            }
            else {
                return false;
            }
            accessExpr = accessExpr.expression;
        }
        else {
            return false;
        }
        if (id !== memberName)
            return false;
    }
    const s = (0, ast_tools_1.dealias)(tc.getSymbolAtLocation(accessExpr), tc);
    if (s === undefined)
        return false;
    return tc.getFullyQualifiedName(s) === 'goog.global';
}
//# sourceMappingURL=absolute_matcher.js.map