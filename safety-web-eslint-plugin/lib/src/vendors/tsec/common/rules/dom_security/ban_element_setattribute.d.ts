import { Checker } from '../../third_party/tsetse/checker';
import { ErrorCode } from '../../third_party/tsetse/error_code';
import { AbstractRule } from '../../third_party/tsetse/rule';
import { RuleConfiguration } from '../../rule_configuration';
/**
 * Trusted Types related attribute names that should not be set through
 * `setAttribute` or similar functions.
 */
export declare const TT_RELATED_ATTRIBUTES: Set<string>;
/** A Rule that looks for use of Element#setAttribute and similar properties. */
export declare abstract class BanSetAttributeRule extends AbstractRule {
    readonly code = ErrorCode.CONFORMANCE_PATTERN;
    private readonly propMatchers;
    private readonly allowlist?;
    constructor(configuration: RuleConfiguration);
    protected abstract readonly errorMessage: string;
    protected abstract readonly isSecuritySensitiveAttrName: (attr: string) => boolean;
    /**
     * The flag that controls whether the rule matches the "unsure" cases. For all
     * rules that extends this class, only one of them should set this to true,
     * otherwise we will get essentially duplicate finidngs.
     */
    protected abstract readonly looseMatch: boolean;
    /**
     * Check if the attribute name is a literal in a setAttribute call. We will
     * skip matching if the attribute name is not in the blocklist.
     */
    private isCalledWithAllowedAttribute;
    /**
     * Check if the attribute name is a literal and the namespace is null in a
     * setAttributeNS call. We will skip matching if the attribute name is not in
     * the blocklist.
     */
    private isCalledWithAllowedAttributeNS;
    /**
     * Check if the attribute name is a literal that is not in the blocklist.
     */
    private isAllowedAttribute;
    private matchNode;
    register(checker: Checker): void;
}
/** A Rule that looks for use of Element#setAttribute and similar properties. */
export declare class Rule extends BanSetAttributeRule {
    static readonly RULE_NAME = "ban-element-setattribute";
    readonly ruleName: string;
    protected readonly errorMessage: string;
    protected isSecuritySensitiveAttrName: (attr: string) => boolean;
    protected readonly looseMatch = true;
    constructor(configuration?: RuleConfiguration);
}
