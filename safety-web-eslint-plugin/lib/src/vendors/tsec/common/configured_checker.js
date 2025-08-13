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
exports.getConfiguredChecker = getConfiguredChecker;
const rule_groups_1 = require("./rule_groups");
const checker_1 = require("./third_party/tsetse/checker");
const exemption_config_1 = require("./exemption_config");
/**
 * Create a new cheker with all enabled rules registered and the exemption list
 * configured.
 */
function getConfiguredChecker(program, host) {
    let exemptionList = undefined;
    const exemptionConfigPath = (0, exemption_config_1.resolveExemptionConfigPath)(program.getCompilerOptions()['configFilePath']);
    const errors = [];
    if (exemptionConfigPath) {
        const projExemptionConfigOrErr = (0, exemption_config_1.parseExemptionConfig)(exemptionConfigPath);
        if (projExemptionConfigOrErr instanceof exemption_config_1.ExemptionList) {
            exemptionList = projExemptionConfigOrErr;
        }
        else {
            errors.push(...projExemptionConfigOrErr);
        }
    }
    // Create all enabled rules with corresponding exemption list entries.
    const checker = new checker_1.Checker(program, host);
    const wildcardAllowListEntry = exemptionList === null || exemptionList === void 0 ? void 0 : exemptionList.get('*');
    const rules = rule_groups_1.ENABLED_RULES.map((ruleCtr) => {
        const allowlistEntries = [];
        const allowlistEntry = exemptionList === null || exemptionList === void 0 ? void 0 : exemptionList.get(ruleCtr.RULE_NAME);
        if (allowlistEntry) {
            allowlistEntries.push(allowlistEntry);
        }
        if (wildcardAllowListEntry) {
            allowlistEntries.push(wildcardAllowListEntry);
        }
        return new ruleCtr({ allowlistEntries });
    });
    // Register all rules.
    for (const rule of rules) {
        rule.register(checker);
    }
    return { checker, errors };
}
//# sourceMappingURL=configured_checker.js.map