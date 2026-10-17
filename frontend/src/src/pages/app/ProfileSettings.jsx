import { useEffect, useState } from "react";
import { profileApi, studyApi } from "../../api/client";

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e8eaf6" };

export default function ProfileSettings() {
  const [form, setForm] = useState(null);
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([profileApi.get(), studyApi.reminderPreview()]).then(([profileResult, reminderResult]) => {
      if (cancelled) return;
      if (profileResult.status === "fulfilled") {
        const user = profileResult.value.user || {};
        setForm({
          username: user.username || "",
          daily_goal: user.daily_goal || 10,
          review_limit: user.review_limit || 10,
          level: user.level || "A1",
          tts_voice: user.tts_voice || "en-US",
          email_reminder: user.email_reminder !== false,
          reminder_time: Number(String(user.reminder_time || "08:00").slice(0, 2)) || 8,
        });
      } else setError(profileResult.reason?.message || "Không tải được cài đặt.");
      if (reminderResult.status === "fulfilled") setReminder(reminderResult.value);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await profileApi.update({ ...form, reminder_time: Number(form.reminder_time) });
      setForm(current => ({ ...current, ...(result.user || {}) }));
      setMessage(result.message || "Đã lưu cài đặt.");
    } catch (err) {
      setError(err.message || "Không lưu được cài đặt.");
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 32, color: "#94a3b8" }}>Đang tải cài đặt...</div>;
  if (!form) return <div style={{ padding: 32, color: "#f87171" }}>{error}</div>;

  return <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px", color: "#e8eaf6" }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Hồ sơ và cài đặt</h1>
    <p style={{ color: "#8892b0", marginBottom: 24 }}>Các thay đổi được lưu vào tài khoản của bạn.</p>
    <form onSubmit={save} style={{ display: "grid", gap: 18, padding: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <label>Tên hiển thị<input style={inputStyle} value={form.username} onChange={e => update("username", e.target.value)} /></label>
      <label>Mục tiêu học mới mỗi ngày<select style={inputStyle} value={form.daily_goal} onChange={e => update("daily_goal", Number(e.target.value))}>{[5,10,15,20,30].map(v => <option key={v} value={v}>{v} từ</option>)}</select></label>
      <label>Số từ ôn mỗi ngày<select style={inputStyle} value={form.review_limit} onChange={e => update("review_limit", Number(e.target.value))}>{[5,10,15,20,30].map(v => <option key={v} value={v}>{v} từ</option>)}</select></label>
      <label>Cấp độ<select style={inputStyle} value={form.level} onChange={e => update("level", e.target.value)}>{["A1","B1","B2","C1","IELTS"].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Giọng đọc<select style={inputStyle} value={form.tts_voice} onChange={e => update("tts_voice", e.target.value)}><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option></select></label>
      <label>Giờ nhắc ôn<select style={inputStyle} value={form.reminder_time} onChange={e => update("reminder_time", Number(e.target.value))}>{[8,12,20].map(v => <option key={v} value={v}>{String(v).padStart(2,"0")}:00</option>)}</select></label>
      <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" checked={!!form.email_reminder} onChange={e => update("email_reminder", e.target.checked)} /> Nhận email nhắc ôn tập</label>
      {reminder && <p style={{ color: "#94a3b8", margin: 0 }}>Hiện có {reminder.due_review_count || 0} từ đến hạn ôn tập.</p>}
      {error && <p role="alert" style={{ color: "#f87171", margin: 0 }}>{error}</p>}
      {message && <p role="status" style={{ color: "#34d399", margin: 0 }}>{message}</p>}
      <button disabled={saving} style={{ justifySelf: "start", padding: "10px 18px", border: 0, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", fontWeight: 700, cursor: "pointer" }}>{saving ? "Đang lưu..." : "Lưu cài đặt"}</button>
    </form>
  </main>;
}
