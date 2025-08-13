import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for use of Document#writeln properties.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-document-writeln-calls";
    constructor(configuration?: RuleConfiguration);
}
