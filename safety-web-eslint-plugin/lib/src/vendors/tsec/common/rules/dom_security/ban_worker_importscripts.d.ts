import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/** A Rule that bans the importScripts function in worker global scopes. */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-worker-importscripts";
    constructor(configuration?: RuleConfiguration);
}
