import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A rule that bans TrustedTypeProlicyFactory#createPolicy.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-trustedtypes-createpolicy";
    constructor(configuration?: RuleConfiguration);
}
