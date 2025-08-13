import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for use of Range#createContextualFragment properties.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-range-createcontextualfragment";
    constructor(configuration?: RuleConfiguration);
}
