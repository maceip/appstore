import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for calls to create new Workers and suggests using a safe
 * creator instead.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-shared-worker-calls";
    constructor(configuration?: RuleConfiguration);
}
