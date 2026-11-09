import type { Person } from "./model";

export function childrenOf(people: Person[]): Map<string, Person[]> {
  const map = new Map<string, Person[]>();
  for (const person of people) {
    if (!person.fatherId) continue;
    const list = map.get(person.fatherId);
    if (list) list.push(person);
    else map.set(person.fatherId, [person]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "vi"));
  }
  return map;
}

export function treeRoots(people: Person[]): Person[] {
  const ids = new Set(people.map((person) => person.id));
  return people
    .filter((person) => !person.fatherId || !ids.has(person.fatherId))
    .sort(
      (a, b) =>
        a.generation - b.generation ||
        (a.order ?? 0) - (b.order ?? 0) ||
        a.name.localeCompare(b.name, "vi"),
    );
}

export function pickEgo(people: Person[], preferred: { id?: string; name?: string }): string {
  if (preferred.id && people.some((person) => person.id === preferred.id)) return preferred.id;
  if (preferred.name) {
    const named = people.find((person) => person.name === preferred.name);
    if (named) return named.id;
  }
  return people[0]?.id ?? "";
}

export type CrossLink = {
  personId: string;
  clanId: string;
  name: string;
  role: string;
};

export function crossClanLinks(person: Person, byId: Map<string, Person>): CrossLink[] {
  const specs: { id: string | null; role: string }[] = [
    { id: person.spouseId, role: "Vợ/chồng" },
    { id: person.motherId, role: "Mẹ" },
  ];
  const links: CrossLink[] = [];
  for (const spec of specs) {
    if (!spec.id) continue;
    const other = byId.get(spec.id);
    if (!other?.clanId || other.clanId === person.clanId) continue;
    if (links.some((link) => link.personId === other.id)) continue;
    links.push({ personId: other.id, clanId: other.clanId, name: other.name, role: spec.role });
  }
  return links;
}
