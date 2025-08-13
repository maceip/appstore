import { AllowlistEntry } from './third_party/tsetse/allowlist';
/**
 * A configuration interface passed to the rules with properties configured
 * externally either via allowlist or bootstrap file.
 */
export interface RuleConfiguration {
    /** A list of allowlist blocks. */
    allowlistEntries?: AllowlistEntry[];
}
