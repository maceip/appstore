import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for dynamic assignments to an HTMLScriptElement's src
 * property, and suggests using safe setters instead.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-script-src-assignments";
    constructor(configuration?: RuleConfiguration);
}
