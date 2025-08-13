/**
 * @fileoverview Checker contains all the information we need to perform source
 * file AST traversals and report errors.
 */
import * as ts from 'typescript';
import { Allowlist } from './allowlist';
import { Failure, Fix } from './failure';
/**
 * Tsetse rules use on() and addFailureAtNode() for rule implementations.
 * Rules can get a ts.TypeChecker from checker.typeChecker so typed rules are
 * possible. Compiler uses execute() to run the Tsetse check.
 */
export declare class Checker {
    private readonly host;
    /** Node to handlers mapping for all enabled rules. */
    private readonly nodeHandlersMap;
    /**
     * Mapping from identifier name to handlers for all rules inspecting property
     * names.
     */
    private readonly namedIdentifierHandlersMap;
    /**
     * Mapping from property name to handlers for all rules inspecting property
     * accesses expressions.
     */
    private readonly namedPropertyAccessHandlersMap;
    /**
     * Mapping from string literal value to handlers for all rules inspecting
     * string literals.
     */
    private readonly stringLiteralElementAccessHandlersMap;
    private failures;
    private exemptedFailures;
    private currentSourceFile;
    private currentCode;
    private readonly options;
    /** Allow typed rules via typeChecker. */
    typeChecker: ts.TypeChecker;
    constructor(program: ts.Program, host: ts.ModuleResolutionHost);
    /**
     * This doesn't run any checks yet. Instead, it registers `handlerFunction` on
     * `nodeKind` node in `nodeHandlersMap` map. After all rules register their
     * handlers, the source file AST will be traversed.
     */
    on<T extends ts.Node>(nodeKind: T['kind'], handlerFunction: (checker: Checker, node: T) => void, code: number): void;
    /**
     * Similar to `on`, but registers handlers on more specific node type, i.e.,
     * identifiers.
     */
    onNamedIdentifier(identifierName: string, handlerFunction: (checker: Checker, node: ts.Identifier) => void, code: number): void;
    /**
     * Similar to `on`, but registers handlers on more specific node type, i.e.,
     * property access expressions.
     */
    onNamedPropertyAccess(propertyName: string, handlerFunction: (checker: Checker, node: ts.PropertyAccessExpression) => void, code: number): void;
    /**
     * Similar to `on`, but registers handlers on more specific node type, i.e.,
     * element access expressions with string literals as keys.
     */
    onStringLiteralElementAccess(key: string, handlerFunction: (checker: Checker, node: ts.ElementAccessExpression) => void, code: number): void;
    /**
     * Add a failure with a span.
     * @param source the origin of the failure, e.g., the name of a rule reporting
     *     the failure
     * @param fixes optional, automatically generated fixes that can remediate the
     *     failure
     */
    addFailure(start: number, end: number, failureText: string, source: string | undefined, allowlist: Allowlist | undefined, fixes?: Fix[], relatedInformation?: ts.DiagnosticRelatedInformation[]): void;
    addFailureAtNode(node: ts.Node, failureText: string, source: string | undefined, allowlist: Allowlist | undefined, fixes?: Fix[], relatedInformation?: ts.DiagnosticRelatedInformation[]): void;
    createRelatedInformation(node: ts.Node, messageText: string): ts.DiagnosticRelatedInformation;
    /** Dispatch general handlers registered via `on` */
    dispatchNodeHandlers(node: ts.Node): void;
    /** Dispatch identifier handlers registered via `onNamedIdentifier` */
    dispatchNamedIdentifierHandlers(id: ts.Identifier): void;
    /**
     * Dispatch property access handlers registered via `onNamedPropertyAccess`
     */
    dispatchNamedPropertyAccessHandlers(prop: ts.PropertyAccessExpression): void;
    /**
     * Dispatch string literal handlers registered via
     * `onStringLiteralElementAccess`.
     */
    dispatchStringLiteralElementAccessHandlers(elem: ts.ElementAccessExpression): void;
    /**
     * Walk `sourceFile`, invoking registered handlers with Checker as the first
     * argument and current node as the second argument. Return failures if there
     * are any.
     *
     * Callers of this function can request that the checker report violations
     * that have been exempted by an allowlist by setting the
     * `reportExemptedViolations` parameter to `true`. The function will return an
     * object that contains both the exempted and unexempted failures.
     */
    execute(sourceFile: ts.SourceFile): Failure[];
    execute(sourceFile: ts.SourceFile, reportExemptedViolations: false): Failure[];
    execute(sourceFile: ts.SourceFile, reportExemptedViolations: true): {
        failures: Failure[];
        exemptedFailures: Failure[];
    };
    resolveModuleName(moduleName: string, sourceFile: ts.SourceFile): ts.ResolvedModuleWithFailedLookupLocations;
}
