/** Names of all Trusted Types */
export type TrustedTypes = 'TrustedHTML' | 'TrustedScript' | 'TrustedScriptURL';
/**
 * Trusted Types configuration used to match Trusted values in the assignments
 * to sinks.
 */
export interface TrustedTypesConfig {
    allowAmbientTrustedTypesDeclaration: boolean;
    /**
     * A characteristic component of the absolute path of the definition file.
     */
    modulePathMatcher: string;
    /**
     * The fully qualified name of the trusted type to allow. E.g.
     * "global.TrustedHTML".
     */
    typeName: TrustedTypes;
}
/**
 * Trusted Types configuration allowing usage of `TrustedHTML` for a given rule.
 */
export declare const TRUSTED_HTML: TrustedTypesConfig;
/**
 * Trusted Types configuration allowing usage of `TrustedScript` for a given
 * rule.
 */
export declare const TRUSTED_SCRIPT: TrustedTypesConfig;
/**
 * Trusted Types configuration allowing usage of `TrustedScriptURL` for a given
 * rule.
 */
export declare const TRUSTED_SCRIPT_URL: TrustedTypesConfig;
