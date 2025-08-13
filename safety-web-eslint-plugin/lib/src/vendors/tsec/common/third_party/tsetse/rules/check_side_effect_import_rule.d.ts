import { Checker } from '../checker';
import { ErrorCode } from '../error_code';
import { AbstractRule } from '../rule';
/**
 * Checks side effects imports and adds failures on module resolution errors.
 * This is an equivalent of the TS2307 error, but for side effects imports.
 */
export declare class Rule extends AbstractRule {
    static readonly RULE_NAME = "check-imports";
    readonly ruleName = "check-imports";
    readonly code = ErrorCode.BAD_SIDE_EFFECT_IMPORT;
    register(checker: Checker): void;
}
