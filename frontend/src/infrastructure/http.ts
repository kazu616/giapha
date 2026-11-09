import type {
  Clan,
  ClanEvent,
  Graph,
  Kinship,
  NewsItem,
  OpenPerson,
  Person,
  Place,
  Prefer,
  Region,
  Rule,
  User,
} from "../domain/model";

const API = "/api";
const TOKEN_KEY = "giapha_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode or blocked storage */
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { ...init, headers });
  } catch {
    throw new Error("Không kết nối được máy chủ.");
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Không thực hiện được yêu cầu.";
    throw new Error(message);
  }

  return data;
}

function asArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (isRecord(data)) {
    for (const key of ["items", "data", "news", "events", "clans", "people"]) {
      const value = data[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function readUser(data: unknown): User {
  const source = isRecord(data) && isRecord(data.user) ? data.user : data;
  if (!isRecord(source) || typeof source.id !== "string" || typeof source.email !== "string") {
    throw new Error("Không đọc được hồ sơ.");
  }
  return {
    id: source.id,
    email: source.email,
    name: text(source.name),
    role: text(source.role) || "member",
    personId: typeof source.personId === "string" ? source.personId : null,
    personName: typeof source.personName === "string" ? source.personName : null,
    clanId: typeof source.clanId === "string" ? source.clanId : null,
    clanKind: typeof source.clanKind === "string" ? source.clanKind : null,
  };
}

function readSession(data: unknown): { token: string; user: User } {
  if (!isRecord(data) || typeof data.token !== "string" || !data.token) {
    throw new Error("Đăng nhập không thành công.");
  }
  return { token: data.token, user: readUser(data.user ?? data) };
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  return readSession(await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }));
}

export async function register(
  email: string,
  password: string,
  name: string,
  personId: string,
): Promise<{ token: string; user: User }> {
  return readSession(
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, personId }),
    }),
  );
}

export async function getAvailablePeople(): Promise<OpenPerson[]> {
  return asArray(await request("/people/available"))
    .filter((row) => typeof row.id === "string")
    .map((row) => ({
      id: row.id as string,
      name: text(row.name),
      generation: typeof row.generation === "number" ? row.generation : 0,
      clanId: text(row.clanId),
      clanName: text(row.clanName),
    }));
}

export async function getMyPlace(): Promise<Place> {
  const data = await request("/auth/me/place");
  if (!isRecord(data) || typeof data.personId !== "string") {
    throw new Error("Không tìm được vị trí trên gia phả.");
  }
  const path = Array.isArray(data.path) ? data.path.filter(isRecord) : [];
  return {
    personId: data.personId,
    name: text(data.name),
    clanId: text(data.clanId),
    clanKind: text(data.clanKind),
    generation: typeof data.generation === "number" ? data.generation : 0,
    path: path
      .filter((step) => typeof step.id === "string")
      .map((step) => ({
        id: step.id as string,
        name: text(step.name),
        generation: typeof step.generation === "number" ? step.generation : 0,
      })),
  };
}

export async function getMe(): Promise<User> {
  return readUser(await request("/auth/me"));
}

export async function updateMe(name: string): Promise<User> {
  const data = await request("/auth/me", { method: "PATCH", body: JSON.stringify({ name }) });
  if (data) {
    try {
      return readUser(data);
    } catch {
      /* server may answer without a user body */
    }
  }
  return getMe();
}

export async function getClans(): Promise<Clan[]> {
  return asArray(await request("/clans"))
    .filter((row) => typeof row.id === "string")
    .map((row) => ({
      id: row.id as string,
      name: text(row.name) || (row.id as string),
      kind: text(row.kind),
    }));
}

export async function getPeople(clanId: string): Promise<Person[]> {
  const rows = asArray(await request(`/people?clan=${encodeURIComponent(clanId)}`));
  return rows
    .filter((row) => typeof row.id === "string" && typeof row.name === "string")
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      gender: text(row.gender),
      fatherId: typeof row.fatherId === "string" ? row.fatherId : null,
      motherId: typeof row.motherId === "string" ? row.motherId : null,
      spouseId: typeof row.spouseId === "string" ? row.spouseId : null,
      order: typeof row.order === "number" ? row.order : null,
      generation: typeof row.generation === "number" ? row.generation : 0,
      note: text(row.note),
      clanId: text(row.clanId) || clanId,
    }));
}

export async function kinship(input: {
  fromId: string;
  toId: string;
  region: Region;
  graph: Graph;
  prefer: Prefer;
}): Promise<Kinship> {
  const data = await request("/kinship", { method: "POST", body: JSON.stringify(input) });
  if (!isRecord(data)) throw new Error("Không tính được cách xưng hô.");
  return {
    term: text(data.term),
    termGoc: text(data.termGoc),
    reverseTerm: text(data.reverseTerm),
    side: text(data.side),
    kind: text(data.kind),
    a: typeof data.a === "number" ? data.a : null,
    b: typeof data.b === "number" ? data.b : null,
    ancestorId: typeof data.ancestorId === "string" ? data.ancestorId : null,
  };
}

export async function getNews(): Promise<NewsItem[]> {
  return asArray(await request("/news")).map((row, index) => ({
    id: text(row.id) || `news-${index}`,
    title: text(row.title),
    body: text(row.body),
  }));
}

export async function createNews(input: { title: string; body: string }): Promise<void> {
  await request("/news", { method: "POST", body: JSON.stringify(input) });
}

export async function getEvents(): Promise<ClanEvent[]> {
  return asArray(await request("/events")).map((row, index) => ({
    id: text(row.id) || `event-${index}`,
    title: text(row.title),
    kind: text(row.kind),
    eventDate: text(row.eventDate),
    place: text(row.place),
    body: text(row.body),
  }));
}

export async function createEvent(input: {
  title: string;
  kind: string;
  eventDate: string;
  place: string;
  body: string;
}): Promise<void> {
  await request("/events", { method: "POST", body: JSON.stringify(input) });
}

export function normalizeRule(data: unknown, a: string, b: string): Rule | null {
  if (!isRecord(data)) return null;
  const direct = ruleFrom(data);
  if (direct) return direct;
  const nested = data[`${a}-${b}`];
  if (isRecord(nested)) return ruleFrom(nested);
  return null;
}

function ruleFrom(obj: Record<string, unknown>): Rule | null {
  const rule = {
    type: text(obj.type),
    scope: text(obj.scope),
    tone: text(obj.tone),
    han: text(obj.han),
  };
  if (!rule.type && !rule.scope && !rule.tone && !rule.han) return null;
  return rule;
}

export async function getRule(a: string, b: string): Promise<Rule> {
  const data = await request(`/rules?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
  const rule = normalizeRule(data, a, b);
  if (!rule) throw new Error("Không tìm thấy quy tắc.");
  return rule;
}
