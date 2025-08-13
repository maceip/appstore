import * as ts from 'typescript';
import { Checker } from '../../checker';
import { Fixer } from '../fixer';
import { PatternEngineConfig } from '../pattern_config';
/**
 * A patternEngine is the logic that handles a specific PatternKind.
 */
export declare abstract class PatternEngine {
    protected readonly ruleName: string;
    protected readonly config: PatternEngineConfig;
    protected readonly fixers?: Fixer[] | undefined;
    private readonly allowlist;
    constructor(ruleName: string, config: PatternEngineConfig, fixers?: Fixer[] | undefined);
    /**
     * `register` will be called by the ConformanceRule to tell Tsetse the
     * PatternEngine will handle matching. Implementations should use
     * `checkAndFilterResults` as a wrapper for `check`.
     */
    abstract register(checker: Checker): void;
    /**
     * A composer that wraps checking functions with code handling aspects of the
     * analysis that are not engine-specific, and which defers to the
     * subclass-specific logic afterwards. Subclasses should transform their
     * checking logic with this composer before registered on the checker.
     */
    protected wrapCheckWithAllowlistingAndFixer<T extends ts.Node>(checkFunction: (tc: ts.TypeChecker, n: T) => ts.Node | undefined): (c: Checker, n: T) => void;
}
