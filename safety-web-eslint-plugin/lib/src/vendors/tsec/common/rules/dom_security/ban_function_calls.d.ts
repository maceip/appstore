import { Checker } from '../../third_party/tsetse/checker';
import { ErrorCode } from '../../third_party/tsetse/error_code';
import { AbstractRule } from '../../third_party/tsetse/rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for calls to the constructor of Function, either directly
 * or through Function.prototype.constructor.
 */
export declare class Rule extends AbstractRule {
    static readonly RULE_NAME = "ban-function-calls";
    readonly ruleName = "ban-function-calls";
    readonly code = ErrorCode.CONFORMANCE_PATTERN;
    private readonly allowTrustedTypes;
    private readonly nameMatcher;
    private readonly allowlist?;
    constructor(configuration?: RuleConfiguration);
    register(checker: Checker): void;
    private checkNode;
}
