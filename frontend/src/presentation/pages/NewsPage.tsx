import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, List, Typography } from "antd";
import { useAuth } from "../../application/session";
import type { NewsItem } from "../../domain/model";
import { canEdit } from "../../domain/model";
import { createNews, getNews } from "../../infrastructure/http";

type NewsValues = { title: string; body: string };

export default function NewsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<NewsValues>();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await getNews());
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Không tải được tin tức.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onFinish(values: NewsValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createNews({ title: values.title.trim(), body: values.body.trim() });
      form.resetFields();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không đăng được tin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page stack">
      <div>
        <Typography.Title level={1} className="page-title">
          Tin tức
        </Typography.Title>
        <Typography.Paragraph>Tin của dòng họ.</Typography.Paragraph>
      </div>
      {canEdit(user?.role) ? (
        <Card title="Đăng tin">
          {formError ? <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} /> : null}
          <Form<NewsValues> form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="body" label="Nội dung" rules={[{ required: true, message: "Nhập nội dung" }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Đăng
            </Button>
          </Form>
        </Card>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <List
        loading={loading}
        dataSource={error ? [] : items}
        locale={{ emptyText: <Empty description={error ? "Không tải được tin tức." : "Chưa có tin tức."} /> }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta title={item.title || "Không tiêu đề"} description={item.body} />
          </List.Item>
        )}
      />
    </section>
  );
}
