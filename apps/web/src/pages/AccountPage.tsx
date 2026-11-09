import { useEffect, useState } from "react";
import { Alert, Button, Descriptions, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { getMyPlace, selfTreePath } from "../api";
import type { Place } from "../api";
import { useAuth } from "../auth";

type NameValues = { name: string };

const ROLE_LABEL: Record<string, string> = {
  member: "Thành viên",
  editor: "Biên tập",
  admin: "Quản trị",
};

export default function AccountPage() {
  const { user, saveName } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<NameValues>();
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ name: user?.name ?? "" });
  }, [form, user?.name]);

  useEffect(() => {
    if (!user?.personId) return;
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
  }, [user?.personId]);

  if (!user) {
    return <Alert type="error" showIcon message="Không tải được hồ sơ." />;
  }

  async function onFinish(values: NameValues) {
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      await saveName(values.name.trim());
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được họ tên.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page stack">
      <Typography.Title level={1} className="page-title">
        Tài khoản
      </Typography.Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Họ tên">{user.name || "—"}</Descriptions.Item>
        <Descriptions.Item label="Thư điện tử">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Vai trò">{ROLE_LABEL[user.role] || user.role}</Descriptions.Item>
        <Descriptions.Item label="Người trên gia phả">{user.personName || "Chưa gắn"}</Descriptions.Item>
        {place ? (
          <Descriptions.Item label="Đường tới vị trí của bạn">
            {place.path.map((step) => step.name).join(" → ")}
          </Descriptions.Item>
        ) : null}
      </Descriptions>
      {user.personId ? (
        <Button type="primary" onClick={() => navigate(selfTreePath(user))}>
          Tìm vị trí của tôi trên cây
        </Button>
      ) : null}
      <Form<NameValues> form={form} layout="vertical" requiredMark={false} onFinish={onFinish} style={{ maxWidth: 420 }}>
        <Form.Item name="name" label="Đổi họ tên" rules={[{ required: true, message: "Nhập họ tên" }]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          Lưu
        </Button>
      </Form>
      {saved ? <Alert type="success" showIcon message="Đã lưu họ tên." /> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
    </section>
  );
}
