import { Checker } from '../../third_party/tsetse/checker';
import { ErrorCode } from '../../third_party/tsetse/error_code';
import { AbstractRule } from '../../third_party/tsetse/rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A rule that checks the uses of Window#setTimeout and Window#setInterval
 * properties; it also checks the global setTimeout and setInterval functions.
 */
export declare class Rule extends AbstractRule {
    static readonly RULE_NAME = "ban-window-stringfunctiondef";
    readonly ruleName = "ban-window-stringfunctiondef";
    readonly code = ErrorCode.CONFORMANCE_PATTERN;
    private readonly nameMatchers;
    private readonly propMatchers;
    private readonly allowlist?;
    constructor(configuration?: RuleConfiguration);
    register(checker: Checker): void;
}
