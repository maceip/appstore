import { ConformancePatternRule } from '../../third_party/tsetse/rules/conformance_pattern_rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * A Rule that looks for references to the built-in eval() and window.eval()
 * methods. window.eval performs an indirect call to eval(), so a single check
 * for eval() bans both calls.
 */
export declare class Rule extends ConformancePatternRule {
    static readonly RULE_NAME = "ban-eval-calls";
    constructor(configuration?: RuleConfiguration);
}
