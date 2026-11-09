import { useState } from "react";
import { Alert, Button, Descriptions, Form, InputNumber, Typography } from "antd";
import { getRule } from "../api";
import type { Rule } from "../api";

type RuleValues = { a: number; b: number };

export default function RulesPage() {
  const [rule, setRule] = useState<Rule | null>(null);
  const [pair, setPair] = useState<{ a: number; b: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFinish(values: RuleValues) {
    setLoading(true);
    setError(null);
    setRule(null);
    try {
      const next = await getRule(String(values.a), String(values.b));
      setPair({ a: values.a, b: values.b });
      setRule(next);
    } catch (err) {
      setPair(null);
      setError(err instanceof Error ? err.message : "Không tải được quy tắc.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page stack">
      <div>
        <Typography.Title level={1} className="page-title">
          Quy tắc
        </Typography.Title>
        <Typography.Paragraph>Tra quy tắc phả đồ mẫu theo cặp số a và b.</Typography.Paragraph>
      </div>
      <Form<RuleValues> layout="inline" requiredMark={false} onFinish={onFinish}>
        <Form.Item name="a" label="a" rules={[{ required: true, message: "Nhập a" }]}>
          <InputNumber aria-label="a" min={0} precision={0} />
        </Form.Item>
        <Form.Item name="b" label="b" rules={[{ required: true, message: "Nhập b" }]}>
          <InputNumber aria-label="b" min={0} precision={0} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tra cứu
          </Button>
        </Form.Item>
      </Form>
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {!rule && !error ? <Typography.Paragraph>Nhập a và b rồi tra cứu.</Typography.Paragraph> : null}
      {rule && pair ? (
        <Descriptions bordered column={1} title={`Quy tắc ${pair.a}–${pair.b}`}>
          <Descriptions.Item label="Loại">{rule.type || "—"}</Descriptions.Item>
          <Descriptions.Item label="Phạm vi">{rule.scope || "—"}</Descriptions.Item>
          <Descriptions.Item label="Giọng">{rule.tone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Hán">{rule.han || "—"}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </section>
  );
}
