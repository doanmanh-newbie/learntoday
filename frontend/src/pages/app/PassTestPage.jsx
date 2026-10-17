import { useCallback, useEffect, useState } from "react";
import { passTestApi } from "../../api/client";

export default function PassTestPage() {
  const [status, setStatus] = useState(null);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try { setStatus(await passTestApi.status()); }
    catch (err) { setError(err.message || "Không tải được bài kiểm tra."); }
  }, []);
  useEffect(() => { Promise.resolve().then(loadStatus); }, [loadStatus]);

  const start = async id => {
    setBusy(true); setError(""); setResult(null);
    try {
      const data = await passTestApi.get(id);
      setActive({ id, ...data }); setAnswers({});
    } catch (err) { setError(err.message || "Chưa thể bắt đầu bài kiểm tra."); }
    finally { setBusy(false); }
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await passTestApi.submit(active.id, answers);
      setResult(data); setActive(null); await loadStatus();
    } catch (err) { setError(err.message || "Không nộp được bài."); }
    finally { setBusy(false); }
  };

  const tests = status?.pending_tests || [];
  return <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px", color: "#e8eaf6" }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Bài kiểm tra cột mốc</h1>
    <p style={{ color: "#8892b0", marginBottom: 24 }}>Bài đọc hiểu được mở sau khi bạn đạt cột mốc từ vựng.</p>
    {error && <p role="alert" style={{ color: "#f87171" }}>{error}</p>}
    {result && <section style={{ padding: 18, borderRadius: 14, background: "rgba(16,185,129,0.08)", marginBottom: 20 }}><h2>Kết quả: {result.score}%</h2><p>Đúng {result.correct_count}/{result.total_questions} câu.</p></section>}
    {active ? <form onSubmit={submit} style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Mốc {active.milestone?.milestone} từ</h2>
      <article style={{ lineHeight: 1.8, margin: "16px 0 24px", color: "#cbd5e1" }}>{active.test?.passage}</article>
      {(active.test?.questions || []).map(question => <fieldset key={question.id} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <legend>{question.question}</legend>
        {question.options.map((option, index) => <label key={index} style={{ display: "flex", gap: 10, padding: 6 }}><input type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => setAnswers(prev => ({ ...prev, [question.id]: index }))} />{option}</label>)}
      </fieldset>)}
      <button disabled={busy} style={{ padding: "10px 18px", border: 0, borderRadius: 10, background: "#6366f1", color: "white", fontWeight: 700 }}>{busy ? "Đang nộp..." : "Nộp bài"}</button>
      <button type="button" onClick={() => setActive(null)} style={{ marginLeft: 10, padding: "10px 18px", borderRadius: 10 }}>Thoát</button>
    </form> : <section style={{ display: "grid", gap: 12 }}>
      {tests.length === 0 && !status?.milestones?.length && <p style={{ color: "#94a3b8" }}>Bạn chưa đạt cột mốc kiểm tra nào.</p>}
      {(status?.milestones || []).map(item => {
        const pending = tests.some(test => test.id === item.id);
        const remaining = tests.find(test => test.id === item.id)?.countdown_seconds || 0;
        return <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
          <div><strong>Mốc {item.milestone} từ</strong><p style={{ color: "#94a3b8", margin: "4px 0 0" }}>{item.tested_at ? `Đã làm · ${item.score ?? 0}%` : pending && remaining === 0 ? "Đã sẵn sàng" : `Đang chờ ${Math.ceil(remaining / 3600)} giờ`}</p></div>
          {!item.tested_at && <button disabled={busy || !pending || remaining > 0} onClick={() => start(item.id)} style={{ padding: "9px 14px", border: 0, borderRadius: 9, background: pending && remaining === 0 ? "#6366f1" : "#334155", color: "white", cursor: "pointer" }}>{pending && remaining === 0 ? "Bắt đầu" : "Chưa mở"}</button>}
        </div>;
      })}
    </section>}
  </main>;
}
