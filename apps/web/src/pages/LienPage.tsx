import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Select, Space, Spin, Tabs, Typography } from "antd";
import { useSearchParams } from "react-router-dom";
import { getMyPlace, getPeople, isBoundMember, kinship, PREFER_OPTIONS, REGION_OPTIONS, selfTreePath } from "../api";
import type { Person, Place, Prefer, Region } from "../api";
import { useAuth } from "../auth";
import { childrenOf, crossClanLinks, pickEgo, treeRoots } from "../tree";

const TABS = [
  { key: "nguyen", label: "Họ Nguyễn" },
  { key: "duong", label: "Họ Dương" },
];

function Branch({
  person,
  childrenMap,
  byId,
  terms,
  egoId,
  located,
  onOpenClan,
}: {
  person: Person;
  childrenMap: Map<string, Person[]>;
  byId: Map<string, Person>;
  terms: Record<string, string> | null;
  egoId: string;
  located: boolean;
  onOpenClan: (clanId: string) => void;
}) {
  const kids = childrenMap.get(person.id) ?? [];
  const links = crossClanLinks(person, byId).filter((link) => link.clanId === "nguyen" || link.clanId === "duong");
  const term = !terms ? "Đang tính…" : terms[person.id] || (person.id === egoId ? "Bản thân" : "Chưa rõ");
  const classes = ["person-card"];
  if (person.id === egoId) classes.push("is-ego");
  if (located && person.id === egoId) classes.push("is-located");
  return (
    <li>
      <article id={`person-${person.id}`} className={classes.join(" ")}>
        <span className="person-gen">Đời {person.generation || "—"}</span>
        <strong>{person.name}</strong>
        <span className="person-term">{term}</span>
        {links.map((link) => (
          <button
            key={link.personId + link.role}
            type="button"
            className="clan-link"
            onClick={() => onOpenClan(link.clanId)}
          >
            {link.role}: {link.name}
          </button>
        ))}
      </article>
      {kids.length > 0 ? (
        <ul>
          {kids.map((kid) => (
            <Branch
              key={kid.id}
              person={kid}
              childrenMap={childrenMap}
              byId={byId}
              terms={terms}
              egoId={egoId}
              located={located}
              onOpenClan={onOpenClan}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function LienPage() {
  const { user } = useAuth();
  const member = isBoundMember(user);
  const ownHere = member && user?.clanKind === "lien" && !!user.personId && !!user.clanId;
  const [params] = useSearchParams();
  const [tab, setTab] = useState(ownHere && user?.clanId ? user.clanId : "nguyen");
  const [people, setPeople] = useState<Person[]>([]);
  const [egoId, setEgoId] = useState(ownHere ? user?.personId ?? "" : "");
  const [place, setPlace] = useState<Place | null>(null);
  const [located, setLocated] = useState(false);
  const [region, setRegion] = useState<Region>("bac");
  const [prefer, setPrefer] = useState<Prefer>("gan");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<Record<string, string> | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    Promise.allSettled([getPeople("nguyen"), getPeople("duong")]).then((results) => {
      if (!live) return;
      const loaded = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      const failures = results.filter((result) => result.status === "rejected");
      setPeople(loaded);
      setEgoId(member ? (ownHere && user?.personId ? user.personId : "") : pickEgo(loaded, { id: "N07" }));
      if (ownHere && user?.clanId) setTab(user.clanId);
      if (loaded.length === 0) {
        const reason = failures[0]?.status === "rejected" ? failures[0].reason : null;
        setError(reason instanceof Error ? reason.message : "Không tải được liên họ.");
      } else if (failures.length > 0) {
        setError("Một dòng họ chưa tải được. Cây bên dưới chỉ gồm phần đã có.");
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [member, ownHere, user?.personId, user?.clanId]);

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
    if (params.get("vi-tri") !== "1" || !ownHere || !egoId || loading) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`person-${egoId}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setLocated(true);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [params, ownHere, egoId, loading, people, tab]);

  const visible = useMemo(() => people.filter((person) => person.clanId === tab), [people, tab]);
  const byId = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const childrenMap = useMemo(() => childrenOf(visible), [visible]);
  const roots = useMemo(() => treeRoots(visible), [visible]);

  useEffect(() => {
    if (!egoId || visible.length === 0) {
      setTerms({});
      setTermsError(null);
      return;
    }
    let live = true;
    setTerms(null);
    setTermsError(null);
    Promise.all(
      visible.map(async (person) => {
        try {
          const row = await kinship({
            fromId: egoId,
            toId: person.id,
            region,
            graph: "lien",
            prefer,
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
      if (rows.length > 0 && rows.every((row) => !row.ok)) setTermsError("Không tính được cách xưng hô.");
    });
    return () => {
      live = false;
    };
  }, [visible, egoId, region, prefer]);

  function findMe() {
    if (!egoId) return;
    if (user?.clanId) setTab(user.clanId);
    window.setTimeout(() => {
      document.getElementById(`person-${egoId}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setLocated(true);
    }, 40);
  }

  const selfName = user?.personName || place?.name || "bạn";
  const pathText = place && place.clanKind === "lien" ? place.path.map((step) => step.name).join(" → ") : "";

  return (
    <section className="page">
      <Typography.Title level={1} className="page-title">
        Liên họ
      </Typography.Title>
      <Typography.Paragraph>
        {member
          ? `Họ Nguyễn và họ Dương. Nhãn là cách ${selfName} gọi từng người.`
          : "Họ Nguyễn và họ Dương. Nhãn là cách người được chọn gọi từng người."}
      </Typography.Paragraph>
      {member && user?.personId && user.clanKind !== "lien" ? (
        <Alert
          type="info"
          showIcon
          message={`${selfName} nằm trên phả đồ dòng họ.`}
          action={
            <Button href={selfTreePath(user)} type="primary">
              Tới vị trí của tôi
            </Button>
          }
        />
      ) : null}
      <Tabs activeKey={tab} items={TABS} onChange={setTab} />
      <Space wrap className="toolbar">
        {member ? null : (
          <Select
            aria-label="Người xưng hô"
            showSearch
            optionFilterProp="label"
            value={egoId || undefined}
            options={[
              {
                label: "Họ Nguyễn",
                options: people
                  .filter((person) => person.clanId === "nguyen")
                  .map((person) => ({ value: person.id, label: person.name })),
              },
              {
                label: "Họ Dương",
                options: people
                  .filter((person) => person.clanId === "duong")
                  .map((person) => ({ value: person.id, label: person.name })),
              },
            ]}
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
        <Select aria-label="Miền" value={region} options={REGION_OPTIONS} onChange={setRegion} style={{ minWidth: 120 }} />
        <Select
          aria-label="Ưu tiên quan hệ"
          value={prefer}
          options={PREFER_OPTIONS}
          onChange={setPrefer}
          style={{ minWidth: 160 }}
        />
      </Space>
      {pathText ? (
        <Typography.Paragraph>
          Vị trí của {selfName}: {pathText}
        </Typography.Paragraph>
      ) : null}
      {error ? <Alert type="warning" showIcon message={error} style={{ marginBottom: 12 }} /> : null}
      {termsError ? <Alert type="warning" showIcon message={termsError} style={{ marginBottom: 12 }} /> : null}
      {loading ? (
        <div role="status" aria-label="Đang tải liên họ">
          <Spin />
        </div>
      ) : null}
      {!loading && roots.length === 0 ? (
        <Empty description={people.length === 0 ? "Không tải được liên họ." : "Chưa có thành viên trong họ này."} />
      ) : null}
      {!loading && roots.length > 0 ? (
        <div className="tree" role="region" aria-label={tab === "duong" ? "Phả đồ họ Dương" : "Phả đồ họ Nguyễn"}>
          {roots.map((root) => (
            <ul key={root.id}>
              <Branch
                person={root}
                childrenMap={childrenMap}
                byId={byId}
                terms={terms}
                egoId={egoId}
                located={located}
                onOpenClan={setTab}
              />
            </ul>
          ))}
        </div>
      ) : null}
    </section>
  );
}
