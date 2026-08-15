import { type FilterDef } from "@adapttable/core";
import { createContext, useContext } from "react";

import {
  demoFilterDefs,
  kitchenFilterDefs,
  type Locale,
  type Person,
} from "./data";

type DemoFilterSet = "live" | "kitchen";

const DemoFilterSetContext = createContext<DemoFilterSet>("live");

/** Live demo stays simple; Feature Lab recipes can opt into the kitchen set. */
export const DemoFilterSetProvider = DemoFilterSetContext.Provider;

/** Filter definitions for the current demo page. */
export function useDemoFilterDefs(locale: Locale): FilterDef<Person>[] {
  return useContext(DemoFilterSetContext) === "kitchen"
    ? kitchenFilterDefs(locale)
    : demoFilterDefs(locale);
}
