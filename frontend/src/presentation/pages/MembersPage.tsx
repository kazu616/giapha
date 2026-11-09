import { useEffect, useMemo, useState } from "react";
import { Alert, Empty, Input, Select, Space, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { Clan, Person } from "../../domain/model";
import { getClans, getPeople } from "../../infrastructure/http";

export default function MembersPage() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [clanId, setClanId] = useState("__all__");
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    (async () => {
      const rows = await getClans();
      if (!live) return;
      setClans(rows);
      const targets = clanId === "__all__" ? rows : rows.filter((clan) => clan.id === clanId);
      const groups = await Promise.all(targets.map((clan) => getPeople(clan.id)));
      if (!live) return;
      const seen = new Set<string>();
      setPeople(
        groups.flat().filter((person) => {
          if (seen.has(person.id)) return false;
          seen.add(person.id);
          return true;
        }),
      );
    })()
      .catch((err: unknown) => {
        if (!live) return;
        setPeople([]);
        setError(err instanceof Error ? err.message : "Không tải được thành viên.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [clanId]);

  const clanName = useMemo(() => new Map(clans.map((clan) => [clan.id, clan.name])), [clans]);
  const filtered = people.filter((person) =>
    person.name.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")),
  );

  const columns: TableColumnsType<Person> = [
    { title: "Họ tên", dataIndex: "name", key: "name" },
    { title: "Giới tính", dataIndex: "gender", key: "gender", width: 110 },
    { title: "Đời", dataIndex: "generation", key: "generation", width: 80 },
    {
      title: "Dòng họ",
      key: "clan",
      render: (_, person) => clanName.get(person.clanId) || person.clanId,
    },
    { title: "Ghi chú", dataIndex: "note", key: "note", ellipsis: true },
  ];

  return (
    <section className="page">
      <Typography.Title level={1} className="page-title">
        Thành viên
      </Typography.Title>
      <Space wrap className="toolbar">
        <Input.Search
          aria-label="Tìm theo tên"
          allowClear
          placeholder="Tìm theo tên"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ width: 260 }}
        />
        <Select
          aria-label="Lọc dòng họ"
          value={clanId}
          onChange={setClanId}
          style={{ minWidth: 220 }}
          options={[
            { value: "__all__", label: "Tất cả dòng họ" },
            ...clans.map((clan) => ({ value: clan.id, label: clan.name })),
          ]}
        />
      </Space>
      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} /> : null}
      <Table<Person>
        rowKey="id"
        columns={columns}
        dataSource={error ? [] : filtered}
        loading={loading}
        scroll={{ x: 720 }}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        locale={{
          emptyText: error ? (
            <Empty description="Không tải được danh sách thành viên." />
          ) : (
            <Empty description={query.trim() ? "Không thấy tên này." : "Chưa có thành viên."} />
          ),
        }}
      />
    </section>
  );
}
