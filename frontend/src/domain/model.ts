export type Region = "bac" | "trung" | "nam";
export type Graph = "mau" | "lien";
export type Prefer = "gan" | "noi" | "ngoai";

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  personId: string | null;
  personName: string | null;
  clanId: string | null;
  clanKind: string | null;
};

export type OpenPerson = {
  id: string;
  name: string;
  generation: number;
  clanId: string;
  clanName: string;
};

export type PlaceStep = {
  id: string;
  name: string;
  generation: number;
};

export type Place = {
  personId: string;
  name: string;
  clanId: string;
  clanKind: string;
  generation: number;
  path: PlaceStep[];
};

export type Clan = {
  id: string;
  name: string;
  kind: string;
};

export type Person = {
  id: string;
  name: string;
  gender: string;
  fatherId: string | null;
  motherId: string | null;
  spouseId: string | null;
  order: number | null;
  generation: number;
  note: string;
  clanId: string;
};

export type Kinship = {
  term: string;
  termGoc: string;
  reverseTerm: string;
  side: string;
  kind: string;
  a: number | null;
  b: number | null;
  ancestorId: string | null;
};

export type NewsItem = {
  id: string;
  title: string;
  body: string;
};

export type ClanEvent = {
  id: string;
  title: string;
  kind: string;
  eventDate: string;
  place: string;
  body: string;
};

export type Rule = {
  type: string;
  scope: string;
  tone: string;
  han: string;
};

export const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: "bac", label: "Bắc" },
  { value: "trung", label: "Trung" },
  { value: "nam", label: "Nam" },
];

export const PREFER_OPTIONS: { value: Prefer; label: string }[] = [
  { value: "gan", label: "Gần" },
  { value: "noi", label: "Bên nội" },
  { value: "ngoai", label: "Bên ngoại" },
];

export function canEdit(role: string | undefined): boolean {
  return role === "editor" || role === "admin";
}

export function isBoundMember(user: User | null | undefined): boolean {
  return user?.role === "member";
}

export function selfTreePath(user: User): string {
  if (user.role === "member" && user.personId) {
    return `${user.clanKind === "lien" ? "/lien" : "/tree"}?vi-tri=1`;
  }
  return "/tree";
}
