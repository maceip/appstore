"use strict";
// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageIdMap = void 0;
exports.tsetseMessageToMessageId = tsetseMessageToMessageId;
const ban_base_href_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_base_href_assignments");
const ban_document_execcommand_1 = require("./vendors/tsec/common/rules/dom_security/ban_document_execcommand");
const ban_document_write_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_document_write_calls");
const ban_document_writeln_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_document_writeln_calls");
const ban_domparser_parsefromstring_1 = require("./vendors/tsec/common/rules/dom_security/ban_domparser_parsefromstring");
const ban_element_innerhtml_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_element_innerhtml_assignments");
const ban_element_insertadjacenthtml_1 = require("./vendors/tsec/common/rules/dom_security/ban_element_insertadjacenthtml");
const ban_element_outerhtml_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_element_outerhtml_assignments");
const ban_element_setattribute_1 = require("./vendors/tsec/common/rules/dom_security/ban_element_setattribute");
const ban_eval_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_eval_calls");
const ban_function_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_function_calls");
const ban_iframe_srcdoc_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_iframe_srcdoc_assignments");
const ban_object_data_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_object_data_assignments");
const ban_range_createcontextualfragment_1 = require("./vendors/tsec/common/rules/dom_security/ban_range_createcontextualfragment");
const ban_script_appendchild_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_script_appendchild_calls");
const ban_script_content_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_script_content_assignments");
const ban_script_src_assignments_1 = require("./vendors/tsec/common/rules/dom_security/ban_script_src_assignments");
const ban_serviceworkercontainer_register_1 = require("./vendors/tsec/common/rules/dom_security/ban_serviceworkercontainer_register");
const ban_shared_worker_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_shared_worker_calls");
const ban_trustedtypes_createpolicy_1 = require("./vendors/tsec/common/rules/dom_security/ban_trustedtypes_createpolicy");
const ban_window_stringfunctiondef_1 = require("./vendors/tsec/common/rules/dom_security/ban_window_stringfunctiondef");
const ban_worker_calls_1 = require("./vendors/tsec/common/rules/dom_security/ban_worker_calls");
const ban_worker_importscripts_1 = require("./vendors/tsec/common/rules/dom_security/ban_worker_importscripts");
const ban_legacy_conversions_1 = require("./vendors/tsec/common/rules/unsafe/ban_legacy_conversions");
const ban_reviewed_conversions_1 = require("./vendors/tsec/common/rules/unsafe/ban_reviewed_conversions");
exports.messageIdMap = {
    ban_base_href_assignments: '{{ tsetseMessage }}',
    ban_document_execcommand: '{{ tsetseMessage }}',
    ban_document_write_calls: '{{ tsetseMessage }}',
    ban_document_writeln_calls: '{{ tsetseMessage }}',
    ban_domparser_parsefromstring: '{{ tsetseMessage }}',
    ban_element_innerhtml_assignments: '{{ tsetseMessage }}',
    ban_element_insertadjacenthtml: '{{ tsetseMessage }}',
    ban_element_outerhtml_assignments: '{{ tsetseMessage }}',
    ban_element_setattribute: '{{ tsetseMessage }}',
    ban_eval_calls: '{{ tsetseMessage }}',
    ban_function_calls: '{{ tsetseMessage }}',
    ban_iframe_srcdoc_assignments: '{{ tsetseMessage }}',
    ban_object_data_assignments: '{{ tsetseMessage }}',
    ban_range_createcontextualfragment: '{{ tsetseMessage }}',
    ban_script_appendchild_calls: '{{ tsetseMessage }}',
    ban_script_content_assignments: '{{ tsetseMessage }}',
    ban_script_src_assignments: '{{ tsetseMessage }}',
    ban_serviceworkercontainer_register: '{{ tsetseMessage }}',
    ban_shared_worker_calls: '{{ tsetseMessage }}',
    ban_trustedtypes_createpolicy: '{{ tsetseMessage }}',
    ban_window_stringfunctiondef: '{{ tsetseMessage }}',
    ban_worker_calls: '{{ tsetseMessage }}',
    ban_worker_importscripts: '{{ tsetseMessage }}',
    ban_legacy_conversions: '{{ tsetseMessage }}',
    ban_reviewed_conversions: '{{ tsetseMessage }}',
};
const ruleNameToMessageIdMap = new Map([
    [ban_base_href_assignments_1.Rule.RULE_NAME, 'ban_base_href_assignments'],
    [ban_document_execcommand_1.Rule.RULE_NAME, 'ban_document_execcommand'],
    [ban_document_write_calls_1.Rule.RULE_NAME, 'ban_document_write_calls'],
    [ban_document_writeln_calls_1.Rule.RULE_NAME, 'ban_document_writeln_calls'],
    [ban_domparser_parsefromstring_1.Rule.RULE_NAME, 'ban_domparser_parsefromstring'],
    [
        ban_element_innerhtml_assignments_1.Rule.RULE_NAME,
        'ban_element_innerhtml_assignments',
    ],
    [ban_element_insertadjacenthtml_1.Rule.RULE_NAME, 'ban_element_insertadjacenthtml'],
    [
        ban_element_outerhtml_assignments_1.Rule.RULE_NAME,
        'ban_element_outerhtml_assignments',
    ],
    [ban_element_setattribute_1.Rule.RULE_NAME, 'ban_element_setattribute'],
    [ban_eval_calls_1.Rule.RULE_NAME, 'ban_eval_calls'],
    [ban_function_calls_1.Rule.RULE_NAME, 'ban_function_calls'],
    [ban_iframe_srcdoc_assignments_1.Rule.RULE_NAME, 'ban_iframe_srcdoc_assignments'],
    [ban_object_data_assignments_1.Rule.RULE_NAME, 'ban_object_data_assignments'],
    [
        ban_range_createcontextualfragment_1.Rule.RULE_NAME,
        'ban_range_createcontextualfragment',
    ],
    [ban_script_appendchild_calls_1.Rule.RULE_NAME, 'ban_script_appendchild_calls'],
    [ban_script_content_assignments_1.Rule.RULE_NAME, 'ban_script_content_assignments'],
    [ban_script_src_assignments_1.Rule.RULE_NAME, 'ban_script_src_assignments'],
    [
        ban_serviceworkercontainer_register_1.Rule.RULE_NAME,
        'ban_serviceworkercontainer_register',
    ],
    [ban_shared_worker_calls_1.Rule.RULE_NAME, 'ban_shared_worker_calls'],
    [ban_trustedtypes_createpolicy_1.Rule.RULE_NAME, 'ban_trustedtypes_createpolicy'],
    [ban_window_stringfunctiondef_1.Rule.RULE_NAME, 'ban_window_stringfunctiondef'],
    [ban_worker_calls_1.Rule.RULE_NAME, 'ban_worker_calls'],
    [ban_worker_importscripts_1.Rule.RULE_NAME, 'ban_worker_importscripts'],
    [ban_legacy_conversions_1.Rule.RULE_NAME, 'ban_legacy_conversions'],
    [ban_reviewed_conversions_1.Rule.RULE_NAME, 'ban_reviewed_conversions'],
]);
function tsetseMessageToMessageId(tsetseMessage) {
    const match = tsetseMessage.match(/^\[([a-z-]+)\]/);
    if (match !== null) {
        return ruleNameToMessageIdMap.get(match[1]);
    }
    return undefined;
}
//# sourceMappingURL=tsetse_compat.js.map