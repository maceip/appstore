import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A rule that bans writing to HTMLScriptElement#text and
 * HTMLScriptElement#textContent
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-script-content-assignments";
    constructor(configuration?: RuleConfiguration);
}
