import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Select, Space, Spin, Typography } from "antd";
import { useSearchParams } from "react-router-dom";
import { getClans, getMyPlace, getPeople, isBoundMember, kinship, REGION_OPTIONS, selfTreePath } from "../api";
import type { Clan, Person, Place, Region } from "../api";
import { useAuth } from "../auth";
import { childrenOf, pickEgo, treeRoots } from "../tree";

const DEFAULT_CLAN = "nguyen-mau";

function termOf(personId: string, egoId: string, terms: Record<string, string> | null): string {
  if (!terms) return "Đang tính…";
  const term = terms[personId];
  if (term) return term;
  if (personId === egoId) return "Bản thân";
  return "Chưa rõ";
}

function Branch({
  person,
  childrenMap,
  terms,
  egoId,
  located,
}: {
  person: Person;
  childrenMap: Map<string, Person[]>;
  terms: Record<string, string> | null;
  egoId: string;
  located: boolean;
}) {
  const kids = childrenMap.get(person.id) ?? [];
  const classes = ["person-card"];
  if (person.id === egoId) classes.push("is-ego");
  if (located && person.id === egoId) classes.push("is-located");
  return (
    <li>
      <article id={`person-${person.id}`} className={classes.join(" ")}>
        <span className="person-gen">Đời {person.generation || "—"}</span>
        <strong>{person.name}</strong>
        <span className="person-term">{termOf(person.id, egoId, terms)}</span>
      </article>
      {kids.length > 0 ? (
        <ul>
          {kids.map((kid) => (
            <Branch
              key={kid.id}
              person={kid}
              childrenMap={childrenMap}
              terms={terms}
              egoId={egoId}
              located={located}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function TreePage() {
  const { user } = useAuth();
  const member = isBoundMember(user);
  const ownHere = member && user?.clanKind === "mau" && !!user.personId;
  const [params] = useSearchParams();
  const [clans, setClans] = useState<Clan[]>([]);
  const [clanId, setClanId] = useState(ownHere && user?.clanId ? user.clanId : DEFAULT_CLAN);
  const [people, setPeople] = useState<Person[]>([]);
  const [egoId, setEgoId] = useState(ownHere ? user?.personId ?? "" : "");
  const [region, setRegion] = useState<Region>("bac");
  const [terms, setTerms] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (!member || !user?.personId) return;
    let live = true;
    getMyPlace()
      .then((row) => {
        if (live) setPlace(row);
      })
      .catch(() => {
        if (live) setPlace(null);
      });
    return () => {
      live = false;
    };
  }, [member, user?.personId]);

  useEffect(() => {
    let live = true;
    getClans()
      .then((rows) => {
        if (!live) return;
        const mau = rows.filter((clan) => clan.kind === "mau");
        setClans(mau);
        setClanId((current) => {
          if (ownHere && user?.clanId) return user.clanId;
          return mau.some((clan) => clan.id === current) ? current : mau[0]?.id ?? current;
        });
      })
      .catch(() => {
        if (live) setClans([]);
      });
    return () => {
      live = false;
    };
  }, [ownHere, user?.clanId]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    getPeople(clanId)
      .then((rows) => {
        if (!live) return;
        setPeople(rows);
        setEgoId((current) => {
          if (member) return ownHere && user?.personId ? user.personId : "";
          return current && rows.some((person) => person.id === current)
            ? current
            : pickEgo(rows, { name: "Nguyễn Văn Minh" });
        });
      })
      .catch((err: unknown) => {
        if (!live) return;
        setPeople([]);
        setEgoId("");
        setError(err instanceof Error ? err.message : "Không tải được phả đồ.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [clanId, member, ownHere, user?.personId]);

  useEffect(() => {
    if (!egoId || people.length === 0) {
      setTerms({});
      setTermsError(null);
      return;
    }
    let live = true;
    setTerms(null);
    setTermsError(null);
    Promise.all(
      people.map(async (person) => {
        try {
          const row = await kinship({
            fromId: egoId,
            toId: person.id,
            region,
            graph: "mau",
            prefer: "gan",
          });
          return { id: person.id, term: row.term, ok: true };
        } catch {
          return { id: person.id, term: "", ok: false };
        }
      }),
    ).then((rows) => {
      if (!live) return;
      const next: Record<string, string> = {};
      for (const row of rows) next[row.id] = row.term;
      setTerms(next);
      if (rows.length > 0 && rows.every((row) => !row.ok)) {
        setTermsError("Không tính được cách xưng hô.");
      }
    });
    return () => {
      live = false;
    };
  }, [people, egoId, region]);

  useEffect(() => {
    if (params.get("vi-tri") !== "1" || !ownHere || !egoId || loading) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`person-${egoId}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setLocated(true);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [params, ownHere, egoId, loading, people]);

  function findMe() {
    if (!egoId) return;
    document.getElementById(`person-${egoId}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    setLocated(true);
  }

  const childrenMap = useMemo(() => childrenOf(people), [people]);
  const roots = useMemo(() => treeRoots(people), [people]);
  const clanOptions =
    clans.length > 0 ? clans.map((clan) => ({ value: clan.id, label: clan.name })) : [{ value: clanId, label: clanId }];
  const selfName = user?.personName || place?.name || "bạn";
  const pathText = place?.path.map((step) => step.name).join(" → ");

  return (
    <section className="page">
      <Typography.Title level={1} className="page-title">
        Phả đồ
      </Typography.Title>
      <Typography.Paragraph>
        {member
          ? `Cây phụ hệ theo cha. Nhãn là cách ${selfName} gọi từng người.`
          : "Cây phụ hệ theo cha. Nhãn trên mỗi thẻ là cách người được chọn gọi người đó."}
      </Typography.Paragraph>
      {member && !user?.personId ? (
        <Alert type="warning" showIcon message="Tài khoản thành viên chưa gắn với người trên gia phả." />
      ) : null}
      {member && user?.personId && user.clanKind !== "mau" ? (
        <Alert
          type="info"
          showIcon
          message={`${selfName} nằm trên cây liên họ.`}
          action={
            <Button href={selfTreePath(user)} type="primary">
              Tới vị trí của tôi
            </Button>
          }
        />
      ) : null}
      <Space wrap className="toolbar">
        {member ? null : (
          <Select
            aria-label="Dòng họ"
            value={clanId}
            options={clanOptions}
            onChange={setClanId}
            style={{ minWidth: 220 }}
            placeholder="Dòng họ"
          />
        )}
        {member ? null : (
          <Select
            aria-label="Người xưng hô"
            showSearch
            optionFilterProp="label"
            value={egoId || undefined}
            options={people.map((person) => ({
              value: person.id,
              label: `${person.name} · đời ${person.generation}`,
            }))}
            onChange={setEgoId}
            style={{ minWidth: 260 }}
            placeholder="Người xưng hô"
          />
        )}
        {ownHere ? (
          <Button type="primary" onClick={findMe}>
            Tìm vị trí của tôi
          </Button>
        ) : null}
        <Select
          aria-label="Miền"
          value={region}
          options={REGION_OPTIONS}
          onChange={(value) => setRegion(value)}
          style={{ minWidth: 120 }}
        />
      </Space>
      {ownHere && pathText ? (
        <Typography.Paragraph>
          Vị trí của {selfName}: {pathText}
        </Typography.Paragraph>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {termsError ? <Alert type="warning" showIcon message={termsError} style={{ marginTop: 12 }} /> : null}
      {loading ? (
        <div className="center-screen" style={{ minHeight: 240 }} role="status" aria-label="Đang tải phả đồ">
          <Spin />
        </div>
      ) : null}
      {!loading && !error && roots.length === 0 ? <Empty description="Chưa có thành viên trong dòng họ này." /> : null}
      {!loading && !error && roots.length > 0 ? (
        <div className="tree" role="region" aria-label="Phả đồ">
          {roots.map((root) => (
            <ul key={root.id}>
              <Branch person={root} childrenMap={childrenMap} terms={terms} egoId={egoId} located={located} />
            </ul>
          ))}
        </div>
      ) : null}
    </section>
  );
}
