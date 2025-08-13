import { AbstractRule } from './third_party/tsetse/rule';
import { RuleConfiguration } from './rule_configuration';
/**
 * An interface unifying rules extending `AbstractRule` and those extending
 * `ConfornacePatternRule`. The interface exposes rule names and make it
 * possible to configure non-Bazel exemption list during rule creation.
 */
export interface RuleConstructor {
    readonly RULE_NAME: string;
    new (configuration?: RuleConfiguration): AbstractRule;
}
/** Conformance rules related to Trusted Types adoption */
export declare const TRUSTED_TYPES_RELATED_RULES: readonly RuleConstructor[];
/**
 * Conformance rules that should be registered by the check as a compiler
 * plugin.
 */
export declare const ENABLED_RULES: readonly RuleConstructor[];
