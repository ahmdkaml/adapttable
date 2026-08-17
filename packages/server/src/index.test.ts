/**
 * Parsing the table's query on the server.
 *
 * Nearly every test here is about a request that should NOT be trusted,
 * because that is what the package is for. A URL is user input the moment it
 * leaves the browser, and the failure this prevents — a column name chosen by
 * the caller reaching a database — does not look like a bug until it does.
 */
import type { QueryFilterGroup } from "@adapttable/core";
import { serializeFilterTree } from "@adapttable/core";
import { describe, expect, it } from "vitest";

import { parseTableQuery } from "./index";

/**
 * A tree encoded the way the table encodes it — through core's own codec, so
 * this cannot drift from the format the browser actually writes.
 */
const treeParam = (tree: QueryFilterGroup) =>
  `?ft=${encodeURIComponent(serializeFilterTree(tree) ?? "")}`;

const schema = { columns: ["name", "team", "budget"] };

describe("parseTableQuery", () => {
  it("reads a plain query", () => {
    const query = parseTableQuery("?page=2&limit=10&q=ali", schema);

    expect(query.page).toBe(2);
    expect(query.limit).toBe(10);
    expect(query.search).toBe("ali");
    expect(query.rejected).toEqual([]);
  });

  it("computes the offset, so every caller does not", () => {
    expect(parseTableQuery("?page=3&limit=20", schema).offset).toBe(40);
    expect(parseTableQuery("", schema).offset).toBe(0);
  });

  it("takes a Request, a URL, a query string or params", () => {
    const expected = "ali";
    const url = "https://example.com/api/people?q=ali";

    expect(parseTableQuery(url, schema).search).toBe(expected);
    expect(parseTableQuery(new URL(url), schema).search).toBe(expected);
    expect(parseTableQuery({ url }, schema).search).toBe(expected);
    expect(parseTableQuery(new URLSearchParams("q=ali"), schema).search).toBe(
      expected
    );
    expect(parseTableQuery("q=ali", schema).search).toBe(expected);
  });

  describe("what it refuses", () => {
    it("drops a sort on a column that is not in the schema", () => {
      // The failure this exists to prevent: a column name chosen by the
      // caller reaching the database.
      const query = parseTableQuery("?sortBy=password", schema);

      expect(query.sort).toEqual([]);
      expect(query.rejected).toEqual([
        { param: "sortBy", value: "password", reason: "not a sortable column" },
      ]);
    });

    it("keeps the valid levels of a sort chain and drops the rest", () => {
      const query = parseTableQuery("?sort=name:asc,secret:desc,team:desc", {
        columns: ["name", "team"],
      });

      expect(query.sort).toEqual([
        { key: "name", dir: "asc" },
        { key: "team", dir: "desc" },
      ]);
      expect(query.rejected).toHaveLength(1);
    });

    it("drops a filter on a column that is not in the schema", () => {
      const query = parseTableQuery("?f_team=core&f_password=x", schema);

      expect(query.filters).toEqual({ team: "core" });
      expect(query.rejected[0]?.param).toBe("f_password");
    });

    it("drops a groupBy the schema does not allow", () => {
      const query = parseTableQuery("?groupBy=salary", schema);

      expect(query.groupBy).toBeUndefined();
      expect(query.rejected).toHaveLength(1);
    });

    it("clamps a limit above the ceiling and says so", () => {
      const query = parseTableQuery("?limit=999999", {
        ...schema,
        maxLimit: 100,
      });

      expect(query.limit).toBe(100);
      expect(query.rejected[0]?.reason).toContain("100");
    });

    it("never lets a schema raise the limit past the table's own ceiling", () => {
      const query = parseTableQuery("?limit=100000", {
        ...schema,
        maxLimit: 10_000,
      });

      expect(query.limit).toBe(500);
    });

    it("drops the WHOLE filter tree when one field is unknown", () => {
      // Dropping a single condition out of an AND quietly WIDENS the result
      // set — the one failure mode a filter must not have.
      const query = parseTableQuery(
        treeParam({
          combinator: "and",
          conditions: [
            { key: "team", op: "eq", value: "core" },
            { key: "password", op: "contains", value: "x" },
          ],
        }),
        schema
      );

      expect(query.filterTree).toBeUndefined();
      expect(query.rejected[0]?.reason).toContain("unknown columns");
    });

    it("checks a nested group too", () => {
      const query = parseTableQuery(
        treeParam({
          combinator: "and",
          conditions: [
            {
              combinator: "or",
              conditions: [{ key: "password", op: "eq", value: "x" }],
            },
          ],
        }),
        schema
      );

      expect(query.filterTree).toBeUndefined();
    });

    it("keeps a filter tree whose fields all check out", () => {
      const query = parseTableQuery(
        treeParam({
          combinator: "and",
          conditions: [{ key: "team", op: "eq", value: "core" }],
        }),
        schema
      );

      expect(query.filterTree?.combinator).toBe("and");
      expect(query.rejected).toEqual([]);
    });

    it("reports a filter tree it cannot read at all", () => {
      const query = parseTableQuery("?ft=not-json", schema);

      expect(query.filterTree).toBeUndefined();
      expect(query.rejected[0]?.reason).toContain("readable");
    });

    it("drops unknown pivot fields and keeps the rest", () => {
      const query = parseTableQuery(
        "?pivot=rows:team,secret;sum:budget",
        schema
      );

      expect(query.pivot?.rows).toEqual(["team"]);
      expect(query.pivot?.measures).toEqual([{ key: "budget", agg: "sum" }]);
      expect(query.rejected).toHaveLength(1);
    });

    it("reports nothing at all for a pivot with no valid field left", () => {
      const query = parseTableQuery("?pivot=rows:secret", schema);

      expect(query.pivot).toBeUndefined();
    });
  });

  describe("what it tolerates", () => {
    it("treats a nonsense page or limit as the default", () => {
      // A stale bookmark should give a table, not an error page.
      const query = parseTableQuery("?page=-4&limit=abc", schema);

      expect(query.page).toBe(1);
      expect(query.limit).toBe(25);
    });

    it("honours the schema's default page size", () => {
      expect(parseTableQuery("", { ...schema, defaultLimit: 50 }).limit).toBe(
        50
      );
    });

    it("reads a repeated filter as the multi-value it is", () => {
      const query = parseTableQuery("?f_team=core&f_team=platform", schema);

      expect(query.filters.team).toEqual(["core", "platform"]);
    });

    it("skips a malformed level rather than losing the whole ordering", () => {
      const query = parseTableQuery("?sort=name:asc,,team", schema);

      expect(query.sort).toEqual([
        { key: "name", dir: "asc" },
        { key: "team", dir: "asc" },
      ]);
    });

    it("leaves an empty search out rather than filtering on nothing", () => {
      expect(parseTableQuery("?q=", schema).search).toBeUndefined();
    });
  });

  describe("two tables sharing one URL", () => {
    it("reads only its own namespace", () => {
      const query = parseTableQuery("?left.q=ali&right.q=bob&left.page=3", {
        ...schema,
        urlKey: "left",
      });

      expect(query.search).toBe("ali");
      expect(query.page).toBe(3);
    });

    it("reports a rejection without its namespace", () => {
      const query = parseTableQuery("?left.f_password=x", {
        ...schema,
        urlKey: "left",
      });

      expect(query.rejected[0]?.param).toBe("f_password");
    });
  });

  it("passes a cursor through untouched", () => {
    // Opaque by contract: the table never reads one, and neither does this.
    const query = parseTableQuery("?cursor=abc123", schema);

    expect(query.cursor).toBe("abc123");
  });

  it("gives a route enough to be strict when it wants to be", () => {
    const query = parseTableQuery("?sortBy=password&f_secret=1", schema);

    expect(query.rejected).toHaveLength(2);
    expect(
      query.rejected.map((r) => r.param).sort((a, b) => a.localeCompare(b))
    ).toEqual(["f_secret", "sortBy"]);
  });
});
