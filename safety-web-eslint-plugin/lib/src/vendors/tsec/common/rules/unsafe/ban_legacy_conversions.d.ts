import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/** A Rule that bans the use of legacy conversions to safe values. */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-legacy-conversions";
    constructor(configuration?: RuleConfiguration);
}
