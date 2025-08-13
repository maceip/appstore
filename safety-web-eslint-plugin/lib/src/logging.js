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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * @fileoverview Manages the different loggers declared by safety-web's packages.
 * Collects the different to a single file to monitor safety-web/runner usages.
 */
const winston = __importStar(require("winston"));
const SAFETY_WEB_LOG_ENV_NAME = 'SAFETY_WEB_LOG';
const DEFAULT_LOG_LEVEL = 'info';
const SAFETY_WEB_LOG_PATH_NAME = 'SAFETY_WEB_LOG_PATH';
let safetyWebLogPath = 'safety-web.log';
const envLogPath = process.env[SAFETY_WEB_LOG_PATH_NAME];
if (envLogPath !== undefined) {
    if (envLogPath === 'NONE') {
        // Reserved name to disable logging
        safetyWebLogPath = undefined;
    }
}
const logger = winston.createLogger({
    level: getLoggingLevel(),
    format: winston.format.json(),
    transports: safetyWebLogPath !== undefined
        ? [new winston.transports.File({ filename: safetyWebLogPath })]
        : undefined,
});
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }));
}
function getLoggingLevel() {
    const loggingLevels = Object.keys(winston.config.npm.levels);
    const envLevel = process.env[SAFETY_WEB_LOG_ENV_NAME] || DEFAULT_LOG_LEVEL;
    if (!loggingLevels.includes(envLevel)) {
        exports.Logger.error(`Logging level specified for SAFETY_WEB_LOG is unknown. Found ${envLevel}. Possible levels are ${loggingLevels.join(' ')}.`);
    }
    return envLevel;
}
exports.Logger = logger;
//# sourceMappingURL=logging.js.map