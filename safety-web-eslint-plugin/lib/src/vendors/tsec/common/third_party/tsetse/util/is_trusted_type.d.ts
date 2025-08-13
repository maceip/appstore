import * as ts from 'typescript';
import { TrustedTypesConfig } from './trusted_types_configuration';
/**
 * Returns true if the AST expression is Trusted Types compliant and can be
 * safely used in the sink.
 *
 * This function is only called if the rule is configured to allow specific
 * Trusted Type value in the assignment.
 */
export declare function isExpressionOfAllowedTrustedType(tc: ts.TypeChecker, expr: ts.Expression, allowedType: TrustedTypesConfig): boolean;
