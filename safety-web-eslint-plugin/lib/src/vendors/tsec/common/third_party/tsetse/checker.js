"use strict";
/**
 * @fileoverview Checker contains all the information we need to perform source
 * file AST traversals and report errors.
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
exports.Checker = void 0;
const ts = __importStar(require("typescript"));
const failure_1 = require("./failure");
/**
 * Tsetse rules use on() and addFailureAtNode() for rule implementations.
 * Rules can get a ts.TypeChecker from checker.typeChecker so typed rules are
 * possible. Compiler uses execute() to run the Tsetse check.
 */
class Checker {
    constructor(program, host) {
        this.host = host;
        /** Node to handlers mapping for all enabled rules. */
        this.nodeHandlersMap = new Map();
        /**
         * Mapping from identifier name to handlers for all rules inspecting property
         * names.
         */
        this.namedIdentifierHandlersMap = new Map();
        /**
         * Mapping from property name to handlers for all rules inspecting property
         * accesses expressions.
         */
        this.namedPropertyAccessHandlersMap = new Map();
        /**
         * Mapping from string literal value to handlers for all rules inspecting
         * string literals.
         */
        this.stringLiteralElementAccessHandlersMap = new Map();
        this.failures = [];
        this.exemptedFailures = [];
        // currentCode will be set before invoking any handler functions so the value
        // initialized here is never used.
        this.currentCode = 0;
        // Avoid the cost for each rule to create a new TypeChecker.
        this.typeChecker = program.getTypeChecker();
        this.options = program.getCompilerOptions();
    }
    /**
     * This doesn't run any checks yet. Instead, it registers `handlerFunction` on
     * `nodeKind` node in `nodeHandlersMap` map. After all rules register their
     * handlers, the source file AST will be traversed.
     */
    on(nodeKind, handlerFunction, code) {
        const newHandler = { handlerFunction, code };
        const registeredHandlers = this.nodeHandlersMap.get(nodeKind);
        if (registeredHandlers === undefined) {
            this.nodeHandlersMap.set(nodeKind, [newHandler]);
        }
        else {
            registeredHandlers.push(newHandler);
        }
    }
    /**
     * Similar to `on`, but registers handlers on more specific node type, i.e.,
     * identifiers.
     */
    onNamedIdentifier(identifierName, handlerFunction, code) {
        const newHandler = { handlerFunction, code };
        const registeredHandlers = this.namedIdentifierHandlersMap.get(identifierName);
        if (registeredHandlers === undefined) {
            this.namedIdentifierHandlersMap.set(identifierName, [newHandler]);
        }
        else {
            registeredHandlers.push(newHandler);
        }
    }
    /**
     * Similar to `on`, but registers handlers on more specific node type, i.e.,
     * property access expressions.
     */
    onNamedPropertyAccess(propertyName, handlerFunction, code) {
        const newHandler = { handlerFunction, code };
        const registeredHandlers = this.namedPropertyAccessHandlersMap.get(propertyName);
        if (registeredHandlers === undefined) {
            this.namedPropertyAccessHandlersMap.set(propertyName, [newHandler]);
        }
        else {
            registeredHandlers.push(newHandler);
        }
    }
    /**
     * Similar to `on`, but registers handlers on more specific node type, i.e.,
     * element access expressions with string literals as keys.
     */
    onStringLiteralElementAccess(key, handlerFunction, code) {
        const newHandler = { handlerFunction, code };
        const registeredHandlers = this.stringLiteralElementAccessHandlersMap.get(key);
        if (registeredHandlers === undefined) {
            this.stringLiteralElementAccessHandlersMap.set(key, [newHandler]);
        }
        else {
            registeredHandlers.push(newHandler);
        }
    }
    /**
     * Add a failure with a span.
     * @param source the origin of the failure, e.g., the name of a rule reporting
     *     the failure
     * @param fixes optional, automatically generated fixes that can remediate the
     *     failure
     */
    addFailure(start, end, failureText, source, allowlist, fixes, relatedInformation) {
        if (!this.currentSourceFile) {
            throw new Error('Source file not defined');
        }
        if (start > end || end > this.currentSourceFile.end || start < 0) {
            // Since only addFailureAtNode() is exposed for now this shouldn't happen.
            throw new Error(`Invalid start and end position: [${start}, ${end}]` +
                ` in file ${this.currentSourceFile.fileName}.`);
        }
        const failure = new failure_1.Failure(this.currentSourceFile, start, end, failureText, this.currentCode, source, fixes !== null && fixes !== void 0 ? fixes : [], relatedInformation);
        let filePath = this.currentSourceFile.fileName;
        const isFailureAllowlisted = allowlist === null || allowlist === void 0 ? void 0 : allowlist.isAllowlisted(filePath);
        const failures = isFailureAllowlisted ? this.exemptedFailures : this.failures;
        failures.push(failure);
    }
    addFailureAtNode(node, failureText, source, allowlist, fixes, relatedInformation) {
        // node.getStart() takes a sourceFile as argument whereas node.getEnd()
        // doesn't need it.
        this.addFailure(node.getStart(this.currentSourceFile), node.getEnd(), failureText, source, allowlist, fixes, relatedInformation);
    }
    createRelatedInformation(node, messageText) {
        if (!this.currentSourceFile) {
            throw new Error('Source file not defined');
        }
        const start = node.getStart(this.currentSourceFile);
        return {
            category: ts.DiagnosticCategory.Error,
            code: this.currentCode,
            file: this.currentSourceFile,
            start,
            length: node.getEnd() - start,
            messageText,
        };
    }
    /** Dispatch general handlers registered via `on` */
    dispatchNodeHandlers(node) {
        const handlers = this.nodeHandlersMap.get(node.kind);
        if (handlers === undefined)
            return;
        for (const handler of handlers) {
            this.currentCode = handler.code;
            handler.handlerFunction(this, node);
        }
    }
    /** Dispatch identifier handlers registered via `onNamedIdentifier` */
    dispatchNamedIdentifierHandlers(id) {
        const handlers = this.namedIdentifierHandlersMap.get(id.text);
        if (handlers === undefined)
            return;
        for (const handler of handlers) {
            this.currentCode = handler.code;
            handler.handlerFunction(this, id);
        }
    }
    /**
     * Dispatch property access handlers registered via `onNamedPropertyAccess`
     */
    dispatchNamedPropertyAccessHandlers(prop) {
        const handlers = this.namedPropertyAccessHandlersMap.get(prop.name.text);
        if (handlers === undefined)
            return;
        for (const handler of handlers) {
            this.currentCode = handler.code;
            handler.handlerFunction(this, prop);
        }
    }
    /**
     * Dispatch string literal handlers registered via
     * `onStringLiteralElementAccess`.
     */
    dispatchStringLiteralElementAccessHandlers(elem) {
        const ty = this.typeChecker.getTypeAtLocation(elem.argumentExpression);
        if (!ty.isStringLiteral())
            return;
        const handlers = this.stringLiteralElementAccessHandlersMap.get(ty.value);
        if (handlers === undefined)
            return;
        for (const handler of handlers) {
            this.currentCode = handler.code;
            handler.handlerFunction(this, elem);
        }
    }
    execute(sourceFile, reportExemptedViolations = false) {
        const thisChecker = this;
        this.currentSourceFile = sourceFile;
        this.failures = [];
        this.exemptedFailures = [];
        run(sourceFile);
        return reportExemptedViolations ?
            { failures: this.failures, exemptedFailures: this.exemptedFailures } :
            this.failures;
        function run(node) {
            // Dispatch handlers registered via `on`
            thisChecker.dispatchNodeHandlers(node);
            // Dispatch handlers for named identifiers and properties
            if (ts.isIdentifier(node)) {
                thisChecker.dispatchNamedIdentifierHandlers(node);
            }
            else if (ts.isPropertyAccessExpression(node)) {
                thisChecker.dispatchNamedPropertyAccessHandlers(node);
            }
            else if (ts.isElementAccessExpression(node)) {
                thisChecker.dispatchStringLiteralElementAccessHandlers(node);
            }
            ts.forEachChild(node, run);
        }
    }
    resolveModuleName(moduleName, sourceFile) {
        return ts.resolveModuleName(moduleName, sourceFile.fileName, this.options, this.host);
    }
}
exports.Checker = Checker;
//# sourceMappingURL=checker.js.map