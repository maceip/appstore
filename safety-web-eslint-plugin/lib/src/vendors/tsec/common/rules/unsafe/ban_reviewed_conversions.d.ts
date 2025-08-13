import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/** A Rule that bans the use of reviewed conversions to safe values. */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-reviewed-conversions";
    constructor(configuration?: RuleConfiguration);
}
