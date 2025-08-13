import { AllowlistEntry } from './third_party/tsetse/allowlist';
import * as ts from 'typescript';
/**
 * Stores exemption list configurations by rules. Supports commonly used Map
 * operations.
 */
export declare class ExemptionList {
    private readonly map;
    constructor(copyFrom?: ExemptionList);
    get(rule: string): AllowlistEntry | undefined;
    set(rule: string, allowlistEntry: AllowlistEntry): void;
    entries(): MapIterator<[string, AllowlistEntry]>;
    get size(): number;
}
/** Get the path of the exemption configuration file from compiler options. */
export declare function resolveExemptionConfigPath(configFilePath: string): string | undefined;
/** Parse the content of the exemption configuration file. */
export declare function parseExemptionConfig(exemptionConfigPath: string): ExemptionList | ts.Diagnostic[];
