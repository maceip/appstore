import { Checker } from '../../third_party/tsetse/checker';
import { ErrorCode } from '../../third_party/tsetse/error_code';
import { AbstractRule } from '../../third_party/tsetse/rule';
import { RuleConfiguration } from '../../rule_configuration';
/** A Rule that looks for use of Document#execCommand. */
export declare class Rule extends AbstractRule {
    static readonly RULE_NAME = "ban-document-execcommand";
    readonly ruleName = "ban-document-execcommand";
    readonly code = ErrorCode.CONFORMANCE_PATTERN;
    private readonly propMatcher;
    private readonly allowlist?;
    constructor(configuration?: RuleConfiguration);
    register(checker: Checker): void;
}
