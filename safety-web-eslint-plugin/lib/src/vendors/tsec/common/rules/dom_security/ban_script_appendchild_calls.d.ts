import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/** A rule that bans the use of HTMLScriptElement#appendChild */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-script-appendchild-calls";
    constructor(configuration?: RuleConfiguration);
}
