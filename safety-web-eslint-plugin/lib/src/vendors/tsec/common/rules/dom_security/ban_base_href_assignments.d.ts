import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for dynamic assignments to HTMLBaseElement#href property.
 * With this property modified, every URL in the page becomes unsafe.
 * Developers should avoid writing to this property.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-base-href-assignments";
    constructor(configuration?: RuleConfiguration);
}
