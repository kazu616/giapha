import { useState } from "react";
import { Alert, Button, Card, Form, Input, Spin, Typography } from "antd";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../application/session";
import { selfTreePath } from "../../domain/model";

type LoginValues = { email: string; password: string };

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="center-screen" role="status" aria-label="Đang kiểm tra đăng nhập">
        <Spin size="large" />
      </div>
    );
  }
  if (user) return <Navigate to="/tree" replace />;

  async function onFinish(values: LoginValues) {
    setSubmitting(true);
    setError(null);
    try {
      const me = await login(values.email.trim(), values.password);
      navigate(selfTreePath(me), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <Card className="auth-card" title={<Typography.Title level={1} className="page-title">Đăng nhập</Typography.Title>}>
        <Alert
          className="auth-hint"
          type="info"
          showIcon
          message="Tài khoản mẫu"
          description="Quản trị: admin@giapha.local / Admin@12345. Thành viên: minh@giapha.local / Member@12345"
        />
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
        <Form<LoginValues> layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item
            name="email"
            label="Thư điện tử"
            rules={[
              { required: true, message: "Nhập thư điện tử" },
              { type: "email", message: "Thư điện tử chưa đúng" },
            ]}
          >
            <Input autoComplete="username" inputMode="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Nhập mật khẩu" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng nhập
          </Button>
        </Form>
        <Typography.Paragraph style={{ margin: "16px 0 0" }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </Typography.Paragraph>
      </Card>
    </main>
  );
}
