"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyMatcher = void 0;
/**
 * This class matches a property access node, based on a property holder type
 * (through its name), i.e. a class, and a property name.
 *
 * The logic is voluntarily simple: if a matcher for `a.b` tests a `x.y` node,
 * it will return true if:
 * - `x` is of type `a` either directly (name-based) or through inheritance
 *   (ditto),
 * - and, textually, `y` === `b`.
 *
 * Note that the logic is different from TS's type system: this matcher doesn't
 * have any knowledge of structural typing.
 */
class PropertyMatcher {
    static fromSpec(spec) {
        if (spec.indexOf('.prototype.') === -1) {
            throw new Error(`BANNED_PROPERTY expects a .prototype in your query.`);
        }
        const requestParser = /^([\w\d_.-]+)\.prototype\.([\w\d_.-]+)$/;
        const matches = requestParser.exec(spec);
        if (!matches) {
            throw new Error('Cannot understand the BannedProperty spec' + spec);
        }
        const [bannedType, bannedProperty] = matches.slice(1);
        return new PropertyMatcher(bannedType, bannedProperty);
    }
    constructor(bannedType, bannedProperty) {
        this.bannedType = bannedType;
        this.bannedProperty = bannedProperty;
    }
    /**
     * @param n The PropertyAccessExpression we're looking at.
     */
    matches(n, tc) {
        return n.name.text === this.bannedProperty &&
            this.typeMatches(tc.getTypeAtLocation(n.expression));
    }
    /**
     * Match types recursively in the lattice. This function over-approximates
     * the result by considering union types and intersection types as the same.
     */
    typeMatches(inspectedType) {
        var _a, _b;
        // Skip checking mocked objects
        if (((_a = inspectedType.aliasSymbol) === null || _a === void 0 ? void 0 : _a.escapedName) === 'SpyObj')
            return false;
        // Exact type match
        if (((_b = inspectedType.getSymbol()) === null || _b === void 0 ? void 0 : _b.getName()) === this.bannedType) {
            return true;
        }
        // If the type is an intersection/union, check if any of the component
        // matches
        if (inspectedType.isUnionOrIntersection()) {
            return inspectedType.types.some(comp => this.typeMatches(comp));
        }
        const baseTypes = inspectedType.getBaseTypes() || [];
        return baseTypes.some(base => this.typeMatches(base));
    }
}
exports.PropertyMatcher = PropertyMatcher;
//# sourceMappingURL=property_matcher.js.map