import { Checker } from '../../checker';
import { PatternEngine } from './pattern_engine';
/** Engine for the BANNED_NAME pattern */
export declare class NameEngine extends PatternEngine {
    protected readonly banImport: boolean;
    register(checker: Checker): void;
}
/** Engine for the BANNED_IMPORTED_NAME pattern */
export declare class ImportedNameEngine extends NameEngine {
    protected readonly banImport: boolean;
}
