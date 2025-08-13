"use strict";
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENABLED_RULES = exports.TRUSTED_TYPES_RELATED_RULES = void 0;
const ban_base_href_assignments_1 = require("./rules/dom_security/ban_base_href_assignments");
const ban_document_execcommand_1 = require("./rules/dom_security/ban_document_execcommand");
const ban_document_write_calls_1 = require("./rules/dom_security/ban_document_write_calls");
const ban_document_writeln_calls_1 = require("./rules/dom_security/ban_document_writeln_calls");
const ban_domparser_parsefromstring_1 = require("./rules/dom_security/ban_domparser_parsefromstring");
const ban_element_innerhtml_assignments_1 = require("./rules/dom_security/ban_element_innerhtml_assignments");
const ban_element_insertadjacenthtml_1 = require("./rules/dom_security/ban_element_insertadjacenthtml");
const ban_element_outerhtml_assignments_1 = require("./rules/dom_security/ban_element_outerhtml_assignments");
const ban_element_setattribute_1 = require("./rules/dom_security/ban_element_setattribute");
const ban_eval_calls_1 = require("./rules/dom_security/ban_eval_calls");
const ban_function_calls_1 = require("./rules/dom_security/ban_function_calls");
const ban_iframe_srcdoc_assignments_1 = require("./rules/dom_security/ban_iframe_srcdoc_assignments");
const ban_object_data_assignments_1 = require("./rules/dom_security/ban_object_data_assignments");
const ban_range_createcontextualfragment_1 = require("./rules/dom_security/ban_range_createcontextualfragment");
const ban_script_appendchild_calls_1 = require("./rules/dom_security/ban_script_appendchild_calls");
const ban_script_content_assignments_1 = require("./rules/dom_security/ban_script_content_assignments");
const ban_script_src_assignments_1 = require("./rules/dom_security/ban_script_src_assignments");
const ban_serviceworkercontainer_register_1 = require("./rules/dom_security/ban_serviceworkercontainer_register");
const ban_shared_worker_calls_1 = require("./rules/dom_security/ban_shared_worker_calls");
const ban_trustedtypes_createpolicy_1 = require("./rules/dom_security/ban_trustedtypes_createpolicy");
const ban_window_stringfunctiondef_1 = require("./rules/dom_security/ban_window_stringfunctiondef");
const ban_worker_calls_1 = require("./rules/dom_security/ban_worker_calls");
const ban_worker_importscripts_1 = require("./rules/dom_security/ban_worker_importscripts");
const ban_legacy_conversions_1 = require("./rules/unsafe/ban_legacy_conversions");
const ban_reviewed_conversions_1 = require("./rules/unsafe/ban_reviewed_conversions");
/** Conformance rules related to Trusted Types adoption */
exports.TRUSTED_TYPES_RELATED_RULES = [
    ban_base_href_assignments_1.Rule, // https://github.com/w3c/webappsec-trusted-types/issues/172
    ban_document_execcommand_1.Rule,
    ban_document_writeln_calls_1.Rule,
    ban_document_write_calls_1.Rule,
    ban_eval_calls_1.Rule,
    ban_function_calls_1.Rule,
    ban_iframe_srcdoc_assignments_1.Rule,
    ban_object_data_assignments_1.Rule,
    ban_script_appendchild_calls_1.Rule,
    ban_script_content_assignments_1.Rule,
    ban_script_src_assignments_1.Rule,
    ban_serviceworkercontainer_register_1.Rule,
    ban_shared_worker_calls_1.Rule,
    ban_trustedtypes_createpolicy_1.Rule,
    ban_window_stringfunctiondef_1.Rule,
    ban_worker_calls_1.Rule,
    ban_worker_importscripts_1.Rule,
    ban_element_outerhtml_assignments_1.Rule,
    ban_element_innerhtml_assignments_1.Rule,
    ban_element_insertadjacenthtml_1.Rule,
    ban_domparser_parsefromstring_1.Rule,
    ban_element_setattribute_1.Rule,
    ban_range_createcontextualfragment_1.Rule,
    ban_legacy_conversions_1.Rule,
    ban_reviewed_conversions_1.Rule,
];
/**
 * Conformance rules that should be registered by the check as a compiler
 * plugin.
 */
exports.ENABLED_RULES = [
    ...exports.TRUSTED_TYPES_RELATED_RULES,
];
//# sourceMappingURL=rule_groups.js.map