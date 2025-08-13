import { Checker } from './third_party/tsetse/checker';
import * as ts from 'typescript';
/**
 * Create a new cheker with all enabled rules registered and the exemption list
 * configured.
 */
export declare function getConfiguredChecker(program: ts.Program, host: ts.ModuleResolutionHost): {
    checker: Checker;
    errors: ts.Diagnostic[];
};
