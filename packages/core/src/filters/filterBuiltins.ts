/**
 * Built-in filter types. Kept off `filterDefs` so a table that only
 * imports `filterLabel` / `useFrontendData` does not pay for every
 * predicate, chip and operator.
 */
import { createBuiltInFilterSpecs } from "./filterDefs";
import {
  createFilterRegistry,
  type FilterTypeRegistry,
  type FilterTypeSpec,
} from "./filterRegistry";

/** Built-in types — the registry's first consumers. */
export const builtInFilterSpecs: readonly FilterTypeSpec[] =
  // PURE: a table that never imports the registry must not evaluate this.
  /*#__PURE__*/ createBuiltInFilterSpecs();

/** Default registry: every built-in type, nothing else. */
export const defaultFilterRegistry: FilterTypeRegistry =
  /*#__PURE__*/ createFilterRegistry(builtInFilterSpecs);

/** Merge host `filterTypes` onto the built-ins (same `type` replaces). */
export function resolveFilterRegistry(
  extras?: readonly FilterTypeSpec[]
): FilterTypeRegistry {
  if (!extras || extras.length === 0) return defaultFilterRegistry;
  return extras.reduce(
    (registry, spec) => registry.register(spec),
    defaultFilterRegistry
  );
}
