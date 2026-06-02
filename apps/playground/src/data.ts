import type { ColumnDef } from "@adapttable/core";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
}

export const PEOPLE: Person[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", role: "Engineer", team: "Core" }, // prettier-ignore
  { id: "2", name: "Alan Turing", email: "alan@example.com", role: "Founder", team: "Core" }, // prettier-ignore
  { id: "3", name: "Grace Hopper", email: "grace@example.com", role: "Admiral", team: "Platform" }, // prettier-ignore
  { id: "4", name: "Katherine Johnson", email: "katherine@example.com", role: "Mathematician", team: "Data" }, // prettier-ignore
  { id: "5", name: "Margaret Hamilton", email: "margaret@example.com", role: "Engineer", team: "Platform" }, // prettier-ignore
  { id: "6", name: "Barbara Liskov", email: "barbara@example.com", role: "Researcher", team: "Core" }, // prettier-ignore
  { id: "7", name: "Donald Knuth", email: "don@example.com", role: "Author", team: "Data" }, // prettier-ignore
  { id: "8", name: "Linus Torvalds", email: "linus@example.com", role: "Engineer", team: "Platform" }, // prettier-ignore
  { id: "9", name: "Edsger Dijkstra", email: "edsger@example.com", role: "Researcher", team: "Core" }, // prettier-ignore
  { id: "10", name: "Tim Berners-Lee", email: "tim@example.com", role: "Founder", team: "Web" }, // prettier-ignore
  { id: "11", name: "Radia Perlman", email: "radia@example.com", role: "Engineer", team: "Web" }, // prettier-ignore
  { id: "12", name: "Vint Cerf", email: "vint@example.com", role: "Founder", team: "Web" }, // prettier-ignore
];

export const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "email", header: "Email", accessor: (r) => r.email },
  { key: "role", header: "Role", accessor: (r) => r.role, sortable: true },
  { key: "team", header: "Team", accessor: (r) => r.team, sortable: true },
];

/** Shared row action wired by every adapter demo. */
export const editAction = {
  key: "edit",
  label: "Edit",
  onClick: (row: Person) => alert(`Edit ${row.name}`),
};
