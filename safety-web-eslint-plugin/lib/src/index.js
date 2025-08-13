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
exports.rules = void 0;
const trusted_types_checks_1 = require("./trusted_types_checks");
/**
 * Exports 'trusted-types-checks' rule so that those using the ESLint plugin
 * can access it
 */
exports.rules = {
    'trusted-types-checks': trusted_types_checks_1.trustedTypesChecks,
};
//# sourceMappingURL=index.js.map