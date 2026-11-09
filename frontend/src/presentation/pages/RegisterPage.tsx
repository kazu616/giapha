import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, Select, Spin, Typography } from "antd";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../application/session";
import type { OpenPerson } from "../../domain/model";
import { selfTreePath } from "../../domain/model";
import { getAvailablePeople } from "../../infrastructure/http";

type RegisterValues = { name: string; email: string; password: string; personId: string };

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState<OpenPerson[]>([]);

  useEffect(() => {
    let live = true;
    getAvailablePeople()
      .then((rows) => {
        if (live) setPeople(rows);
      })
      .catch(() => {
        if (live) setPeople([]);
      });
    return () => {
      live = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="center-screen" role="status" aria-label="Đang kiểm tra đăng nhập">
        <Spin size="large" />
      </div>
    );
  }
  if (user) return <Navigate to="/tree" replace />;

  async function onFinish(values: RegisterValues) {
    setSubmitting(true);
    setError(null);
    try {
      const me = await register(values.email.trim(), values.password, values.name.trim(), values.personId);
      navigate(selfTreePath(me), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng ký được.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <Card className="auth-card" title={<Typography.Title level={1} className="page-title">Đăng ký</Typography.Title>}>
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
        <Form<RegisterValues> layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: "Nhập họ tên" }]}>
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Thư điện tử"
            rules={[
              { required: true, message: "Nhập thư điện tử" },
              { type: "email", message: "Thư điện tử chưa đúng" },
            ]}
          >
            <Input autoComplete="email" inputMode="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Nhập mật khẩu" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="personId"
            label="Bạn là ai trên gia phả"
            rules={[{ required: true, message: "Chọn đúng người của bạn" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn một lần, sau đó tài khoản gắn với người này"
              options={Array.from(
                people.reduce((groups, person) => {
                  const list = groups.get(person.clanName) ?? [];
                  list.push(person);
                  groups.set(person.clanName, list);
                  return groups;
                }, new Map<string, OpenPerson[]>()),
              ).map(([clanName, rows]) => ({
                label: clanName,
                options: rows.map((person) => ({
                  value: person.id,
                  label: `${person.name} · đời ${person.generation || "—"}`,
                })),
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Tạo tài khoản
          </Button>
        </Form>
        <Typography.Paragraph style={{ margin: "16px 0 0" }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography.Paragraph>
      </Card>
    </main>
  );
}
