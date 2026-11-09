import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, List, Select, Tag, Typography } from "antd";
import { canEdit, createEvent, getEvents } from "../api";
import type { ClanEvent } from "../api";
import { useAuth } from "../auth";

type EventValues = {
  title: string;
  kind: string;
  eventDate: string;
  place: string;
  body: string;
};

const KIND_OPTIONS = [
  { value: "giỗ", label: "Giỗ" },
  { value: "họp", label: "Họp họ" },
];

function kindLabel(kind: string): string {
  return KIND_OPTIONS.find((option) => option.value === kind)?.label ?? kind;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ClanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<EventValues>();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await getEvents());
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Không tải được sự kiện.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onFinish(values: EventValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createEvent({
        title: values.title.trim(),
        kind: values.kind,
        eventDate: values.eventDate,
        place: values.place.trim(),
        body: values.body.trim(),
      });
      form.resetFields();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không tạo được sự kiện.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page stack">
      <div>
        <Typography.Title level={1} className="page-title">
          Sự kiện
        </Typography.Title>
        <Typography.Paragraph>Giỗ và họp họ.</Typography.Paragraph>
      </div>
      {canEdit(user?.role) ? (
        <Card title="Thêm sự kiện">
          {formError ? <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} /> : null}
          <Form<EventValues> form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="kind" label="Loại" rules={[{ required: true, message: "Chọn loại sự kiện" }]}>
              <Select options={KIND_OPTIONS} placeholder="Giỗ hoặc họp" />
            </Form.Item>
            <Form.Item name="eventDate" label="Ngày" rules={[{ required: true, message: "Chọn ngày" }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="place" label="Địa điểm" rules={[{ required: true, message: "Nhập địa điểm" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="body" label="Nội dung" rules={[{ required: true, message: "Nhập nội dung" }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Lưu sự kiện
            </Button>
          </Form>
        </Card>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <List
        loading={loading}
        dataSource={error ? [] : items}
        locale={{ emptyText: <Empty description={error ? "Không tải được sự kiện." : "Chưa có sự kiện."} /> }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <span>
                  {item.title || "Không tiêu đề"}{" "}
                  {item.kind ? <Tag color="#C98C06">{kindLabel(item.kind)}</Tag> : null}
                </span>
              }
              description={
                <span>
                  {[item.eventDate, item.place].filter(Boolean).join(" · ")}
                  {item.body ? <span style={{ display: "block", marginTop: 4 }}>{item.body}</span> : null}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </section>
  );
}
