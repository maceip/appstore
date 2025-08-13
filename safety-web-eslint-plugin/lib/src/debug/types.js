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
/**
 * Helper functions to be used in the debugging console. Registered globally.
 */
function getTypeTree(inspectedType) {
    var _a;
    const res = {
        name: (_a = inspectedType.getSymbol()) === null || _a === void 0 ? void 0 : _a.getName(),
        symbol: inspectedType.getSymbol(),
        baseTypes: (inspectedType.getBaseTypes() || []).map(getTypeTree),
    };
    return res;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
global.getTypeTree = getTypeTree;
//# sourceMappingURL=types.js.map