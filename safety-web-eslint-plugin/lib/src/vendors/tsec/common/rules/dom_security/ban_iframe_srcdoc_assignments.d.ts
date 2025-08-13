import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for assignments to an HTMLIFrameElement's srcdoc property.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-iframe-srcdoc-assignments";
    constructor(configuration?: RuleConfiguration);
}
