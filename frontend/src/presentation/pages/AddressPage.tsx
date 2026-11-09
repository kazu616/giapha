import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Select, Space, Spin, Typography } from "antd";
import { useAuth } from "../../application/session";
import type { Clan, Graph, Kinship, Person, Region } from "../../domain/model";
import { isBoundMember, REGION_OPTIONS } from "../../domain/model";
import { getClans, getPeople, kinship } from "../../infrastructure/http";

const DEFAULT_CLAN = "nguyen-mau";

export default function AddressPage() {
  const { user } = useAuth();
  const member = isBoundMember(user);
  const graph: Graph = user?.clanKind === "lien" ? "lien" : "mau";
  const [clans, setClans] = useState<Clan[]>([]);
  const [clanId, setClanId] = useState(member && user?.clanKind === "mau" && user.clanId ? user.clanId : DEFAULT_CLAN);
  const [people, setPeople] = useState<Person[]>([]);
  const [fromId, setFromId] = useState(member ? user?.personId ?? "" : "");
  const [toId, setToId] = useState("");
  const [region, setRegion] = useState<Region>("bac");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState<Kinship | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getClans()
      .then((rows) => {
        if (!live) return;
        const mau = rows.filter((clan) => clan.kind === "mau");
        setClans(mau);
        setClanId((current) => (mau.some((clan) => clan.id === current) ? current : mau[0]?.id ?? current));
      })
      .catch(() => {
        if (live) setClans([]);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    setResult(null);
    const load =
      member && user?.clanKind === "lien"
        ? Promise.all([getPeople("nguyen"), getPeople("duong")]).then((groups) => groups.flat())
        : getPeople(clanId);
    load
      .then((rows) => {
        if (!live) return;
        setPeople(rows);
        const selfId = member ? user?.personId ?? "" : rows[0]?.id ?? "";
        setFromId(selfId);
        const other = rows.find((person) => person.id !== selfId);
        setToId(other?.id ?? "");
      })
      .catch((err: unknown) => {
        if (!live) return;
        setPeople([]);
        setFromId("");
        setToId("");
        setError(err instanceof Error ? err.message : "Không tải được danh sách thành viên.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [clanId, member, user?.clanKind, user?.personId]);

  const options = people.map((person) => ({
    value: person.id,
    label: `${person.name} · đời ${person.generation}`,
  }));
  const clanOptions =
    clans.length > 0 ? clans.map((clan) => ({ value: clan.id, label: clan.name })) : [{ value: clanId, label: clanId }];
  const fromPerson = people.find((person) => person.id === fromId);
  const toPerson = people.find((person) => person.id === toId);

  async function lookup() {
    if (!fromId || !toId) return;
    setLooking(true);
    setResultError(null);
    setResult(null);
    try {
      const row = await kinship({ fromId, toId, region, graph, prefer: "gan" });
      setResult(row);
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "Không tính được cách xưng hô.");
    } finally {
      setLooking(false);
    }
  }

  return (
    <section className="page">
      <Typography.Title level={1} className="page-title">
        Xưng hô
      </Typography.Title>
      <Typography.Paragraph>
        {member
          ? "Bạn là người gọi. Chọn người được gọi để tra cách xưng hô."
          : "Chọn hai người trong phả đồ mẫu rồi tra cách gọi và cách gọi ngược."}
      </Typography.Paragraph>
      {member && !user?.personId ? (
        <Alert type="warning" showIcon message="Tài khoản thành viên chưa gắn với người trên gia phả." />
      ) : null}
      <Space wrap className="toolbar">
        {member ? null : (
          <Select aria-label="Dòng họ" value={clanId} options={clanOptions} onChange={setClanId} style={{ minWidth: 220 }} />
        )}
        {member ? (
          <Typography.Text>
            Người gọi: <strong>{fromPerson?.name || user?.personName || "Bạn"}</strong>
          </Typography.Text>
        ) : (
          <Select
            aria-label="Người gọi"
            showSearch
            optionFilterProp="label"
            value={fromId || undefined}
            options={options}
            onChange={setFromId}
            placeholder="Người gọi"
            style={{ minWidth: 240 }}
          />
        )}
        <Select
          aria-label="Người được gọi"
          showSearch
          optionFilterProp="label"
          value={toId || undefined}
          options={options}
          onChange={setToId}
          placeholder="Người được gọi"
          style={{ minWidth: 240 }}
        />
        <Select aria-label="Miền" value={region} options={REGION_OPTIONS} onChange={setRegion} style={{ minWidth: 120 }} />
        <Button type="primary" onClick={lookup} loading={looking} disabled={!fromId || !toId}>
          Tra cứu
        </Button>
      </Space>
      {loading ? (
        <div role="status" aria-label="Đang tải thành viên">
          <Spin />
        </div>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {!loading && !error && people.length === 0 ? <Empty description="Chưa có thành viên để tra xưng hô." /> : null}
      {resultError ? <Alert type="error" showIcon message={resultError} /> : null}
      {result && fromPerson && toPerson ? (
        <Card>
          <Typography.Text>
            {fromPerson.name} gọi {toPerson.name} là
          </Typography.Text>
          <div className="result-term">{result.term || "Chưa rõ"}</div>
          <Typography.Text>
            Cách gọi ngược: <strong>{result.reverseTerm || "Chưa rõ"}</strong>
          </Typography.Text>
        </Card>
      ) : null}
    </section>
  );
}
