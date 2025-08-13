import { ESLintUtils } from '@typescript-eslint/utils';
/**
 * Rule to check Trusted Types compliance
 */
export declare const trustedTypesChecks: ESLintUtils.RuleModule<"ban_base_href_assignments" | "ban_document_execcommand" | "ban_document_write_calls" | "ban_document_writeln_calls" | "ban_domparser_parsefromstring" | "ban_element_innerhtml_assignments" | "ban_element_insertadjacenthtml" | "ban_element_outerhtml_assignments" | "ban_element_setattribute" | "ban_eval_calls" | "ban_function_calls" | "ban_iframe_srcdoc_assignments" | "ban_object_data_assignments" | "ban_range_createcontextualfragment" | "ban_script_appendchild_calls" | "ban_script_content_assignments" | "ban_script_src_assignments" | "ban_serviceworkercontainer_register" | "ban_shared_worker_calls" | "ban_trustedtypes_createpolicy" | "ban_window_stringfunctiondef" | "ban_worker_calls" | "ban_worker_importscripts" | "ban_legacy_conversions" | "ban_reviewed_conversions" | "unknown_rule_triggered", [], {
    recommended: boolean;
}, ESLintUtils.RuleListener>;
