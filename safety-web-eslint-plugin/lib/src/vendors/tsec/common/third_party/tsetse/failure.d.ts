import * as ts from 'typescript';
/**
 * A Tsetse check Failure is almost identical to a Diagnostic from TypeScript
 * except that:
 * (1) The error code is defined by each individual Tsetse rule.
 * (2) The optional `source` property is set to `Tsetse` so the host (VS Code
 * for instance) would use that to indicate where the error comes from.
 * (3) There's an optional suggestedFixes field.
 */
export declare class Failure {
    private readonly sourceFile;
    private readonly start;
    private readonly end;
    private readonly failureText;
    private readonly code;
    /**
     * The origin of the failure, e.g., the name of the rule reporting the
     * failure. Can be empty.
     */
    private readonly failureSource;
    private readonly suggestedFixes;
    private readonly relatedInformation?;
    constructor(sourceFile: ts.SourceFile, start: number, end: number, failureText: string, code: number, 
    /**
     * The origin of the failure, e.g., the name of the rule reporting the
     * failure. Can be empty.
     */
    failureSource: string | undefined, suggestedFixes?: Fix[], relatedInformation?: ts.DiagnosticRelatedInformation[] | undefined);
    /**
     * This returns a structure compatible with ts.Diagnostic, but with added
     * fields, for convenience and to support suggested fixes.
     */
    toDiagnostic(): DiagnosticWithFixes;
    /**
     * Same as toDiagnostic, but include the fix in the message, so that systems
     * that don't support displaying suggested fixes can still surface that
     * information. This assumes the diagnostic message is going to be presented
     * within the context of the problematic code.
     */
    toDiagnosticWithStringifiedFixes(): DiagnosticWithFixes;
    toString(): string;
    /***
     * Stringifies an array of `suggestedFixes` for this failure. This is just a
     * heuristic and should be used in systems which do not support fixers
     * integration (e.g. CLI tools).
     */
    mapFixesToReadableString(): string;
    /**
     * Stringifies a `Fix`, in a way that makes sense when presented alongside the
     * finding. This is a heuristic, obviously.
     */
    fixToReadableString(f: Fix): string;
    /**
     * Turns the range to a human readable format to be used by fixers.
     *
     * If the length of the range is non zero it returns the source file text
     * representing the range. Otherwise returns the stringified representation of
     * the source file position.
     */
    readableRange(from: number, to: number): string;
}
/**
 * A `Fix` is a potential repair to the associated `Failure`.
 */
export interface Fix {
    /**
     * The individual text replacements composing that fix.
     */
    changes: IndividualChange[];
}
/** Creates a fix that replaces the given node with the new text. */
export declare function replaceNode(node: ts.Node, replacement: string): Fix;
/** Creates a fix that inserts new text in front of the given node. */
export declare function insertBeforeNode(node: ts.Node, insertion: string): Fix;
/**
 * An individual text replacement/insertion in a source file. Used as part of a
 * `Fix`.
 */
export interface IndividualChange {
    sourceFile: ts.SourceFile;
    start: number;
    end: number;
    replacement: string;
}
/**
 * A ts.Diagnostic that might include fixes, and with an added `end`
 * field for convenience.
 */
export interface DiagnosticWithFixes extends ts.Diagnostic {
    end: number;
    /**
     * An array of fixes for a given diagnostic.
     *
     * Each element (fix) of the array provides a different alternative on how to
     * fix the diagnostic. Every fix is self contained and indepedent to other
     * fixes in the array.
     *
     * These fixes can be integrated into IDEs and presented to the users who can
     * choose the most suitable fix.
     */
    fixes: Fix[];
}
/**
 * Stringifies a `Fix`, replacing the `ts.SourceFile` with the matching
 * filename.
 */
export declare function fixToString(f?: Fix): string;
