import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for assignments to an Element's innerHTML property.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-element-outerhtml-assignments";
    constructor(configuration?: RuleConfiguration);
}
