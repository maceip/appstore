import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/** A rule that bans any use of DOMParser.prototype.parseFromString. */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-domparser-parsefromstring";
    constructor(configuration?: RuleConfiguration);
}
