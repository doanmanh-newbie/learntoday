import { noCopyProps, NO_COPY_CSS } from "../../utils/antiCopy";
import { useCallback, useEffect, useRef, useState } from "react";
import { passTestApi } from "../../api/client";
import { HEARTBEAT_MS, SAVE_DEBOUNCE_MS, answeredCount, formatClock, formatHms, sameAnswers, sanitizeAnswers, secondsLeft } from "./passTimer";

// STT 16: bài đọc hiểu 15 phút. Đồng hồ do SERVER đo (mở bài -> GET bắt đầu phiên; lưu tiến độ -> PUT; thoát -> POST leave).
// Thoát giữa chừng thì câu đã trả lời được lưu và đồng hồ dừng; quay lại bấm "Tiếp tục". Hết giờ thì tự nộp bài.
export default function PassTestPage() {
  const [status, setStatus] = useState(null);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [deadline, setDeadline] = useState(null);     // mốc hết giờ (ms epoch) theo đồng hồ máy, tính từ remaining_seconds của server
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(null);         // đề + đáp án đã chọn, giữ lại để hiện đáp án đúng/giải thích SAU khi nộp
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Giá trị mới nhất cho các callback chạy muộn (đồng hồ, lưu định kỳ, pagehide) mà không bị "state cũ"
  const activeRef = useRef(null);
  const answersRef = useRef({});
  const savedRef = useRef({});                         // phần đã gửi lên server (để không lưu lại thứ không đổi)
  const submittingRef = useRef(false);
  const setAnswersBoth = useCallback(next => { answersRef.current = next; setAnswers(next); }, []);

  const loadStatus = useCallback(async () => {
    try { setStatus(await passTestApi.status()); }
    catch (err) { setError(err.message || "Không tải được bài kiểm tra."); }
  }, []);
  useEffect(() => { Promise.resolve().then(loadStatus); }, [loadStatus]);

  const closeActive = useCallback(() => {
    activeRef.current = null;
    setActive(null); setDeadline(null);
  }, []);

  const submitNow = useCallback(async () => {
    const current = activeRef.current;
    if (!current || submittingRef.current) return;
    submittingRef.current = true; setBusy(true); setError("");
    try {
      const picked = answersRef.current;
      const data = await passTestApi.submit(current.id, picked);
      setReview({ title: current.test?.title, questions: current.test?.questions || [], answers: picked });
      setResult(data); closeActive(); await loadStatus();
    } catch (err) { setError(err.message || "Không nộp được bài."); }
    finally { submittingRef.current = false; setBusy(false); }
  }, [closeActive, loadStatus]);

  const saveNow = useCallback(async () => {
    const current = activeRef.current;
    if (!current || submittingRef.current) return;
    const picked = answersRef.current;
    try {
      await passTestApi.saveProgress(current.id, picked);
      savedRef.current = picked;
    } catch (err) {
      if (err.code === "TIME_UP") submitNow();                                   // server báo hết giờ: nộp những gì đã lưu
      else if (err.code === "NO_SESSION") setError("Phiên làm bài đã kết thúc. Hãy thoát rồi mở lại bài kiểm tra.");
      // lỗi mạng tạm thời: lần lưu sau sẽ thử lại, câu trả lời vẫn còn trên màn hình
    }
  }, [submitNow]);

  const start = async id => {
    setBusy(true); setError(""); setResult(null); setReview(null);
    try {
      const data = await passTestApi.get(id);
      const restored = sanitizeAnswers(data.progress?.answers);
      const remaining = data.progress?.remaining_seconds ?? 900;
      activeRef.current = { id, ...data };
      savedRef.current = restored;
      setAnswersBoth(restored);
      setActive({ id, ...data });
      setDeadline(Date.now() + remaining * 1000); setLeft(remaining);
      if (data.progress?.time_up) setTimeout(submitNow, 0);                      // mở lại đúng lúc đã hết giờ: nộp bản đã lưu
    } catch (err) { setError(err.message || "Chưa thể bắt đầu bài kiểm tra."); }
    finally { setBusy(false); }
  };

  const leave = async () => {
    const current = activeRef.current;
    if (!current) return;
    setBusy(true);
    try { await passTestApi.leave(current.id, answersRef.current); }
    catch { /* mất mạng: lần mở sau server chỉ tính thời gian tới lần lưu cuối */ }
    closeActive(); setBusy(false); await loadStatus();
  };

  // Đếm ngược mỗi giây; hết giờ thì tự nộp
  useEffect(() => {
    if (!deadline) return undefined;
    const timer = setInterval(() => {
      const remaining = secondsLeft(deadline, Date.now());
      setLeft(remaining);
      if (remaining <= 0) { clearInterval(timer); submitNow(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, submitNow]);

  // Lưu sau khi người dùng ngừng chọn (debounce) + lưu định kỳ để giữ phiên
  useEffect(() => {
    if (!active || sameAnswers(answers, savedRef.current)) return undefined;
    const timer = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [answers, active, saveNow]);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(saveNow, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [active, saveNow]);

  // Đóng tab / chuyển trang giữa chừng: báo server dừng đồng hồ và lưu câu đã trả lời (keepalive: vẫn gửi được khi đang đóng)
  useEffect(() => {
    const onHide = () => {
      const current = activeRef.current;
      if (current && !submittingRef.current) passTestApi.leave(current.id, answersRef.current, { keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); onHide(); };   // cả khi rời trang bằng điều hướng trong ứng dụng
  }, []);

  const tests = status?.pending_tests || [];
  const questions = active?.test?.questions || [];
  return <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px", color: "#e9edef" }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Bài kiểm tra cột mốc</h1>
    <p style={{ color: "#a2acb3", marginBottom: 24 }}>Bài đọc hiểu 15 phút, mở sau khi bạn đạt cột mốc từ vựng. Mỗi mốc chỉ làm một lần.</p>
    {error && <p role="alert" style={{ color: "#f87171" }}>{error}</p>}
    {result && <section style={{ padding: 18, borderRadius: 14, background: "rgba(134,162,77,0.08)", marginBottom: 20 }}>
      <h2>Kết quả: {result.score}%</h2>
      <p>Đúng {result.correct_count}/{result.total_questions} câu.{result.late ? " Đã hết giờ nên chỉ tính các câu bạn trả lời trước đó." : ""}</p>
      {review && (result.results || []).map((r, i) => {
        const q = review.questions.find(item => item.id === r.question_id);
        if (!q) return null;
        const picked = review.answers[q.id];
        return <div key={q.id} style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.04)", borderLeft: `4px solid ${r.correct ? "#86a24d" : "#f87171"}` }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{i + 1}. {q.question}</p>
          <p style={{ margin: "0 0 4px", color: r.correct ? "#bef264" : "#fca5a5" }}>
            {r.correct ? "✓ Bạn chọn đúng: " : "✗ Bạn chọn: "}{picked === undefined ? "(chưa chọn)" : q.options[picked]}
          </p>
          {!r.correct && <p style={{ margin: "0 0 4px", color: "#5eead4" }}>Đáp án đúng: {q.options[r.correct_index]}</p>}
          <p style={{ margin: 0, color: "#a2acb3", fontSize: 14 }}>{r.explanation}</p>
        </div>;
      })}
    </section>}
    {active ? <form {...noCopyProps} onSubmit={event => { event.preventDefault(); submitNow(); }} style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
      <style>{NO_COPY_CSS}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Mốc {active.milestone?.milestone} từ{active.test?.title ? ` · ${active.test.title}` : ""}</h2>
        <span role="timer" aria-label="Thời gian còn lại" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: 18, color: left <= 60 ? "#f87171" : "#5eead4" }}>⏱ {formatClock(left)}</span>
      </div>
      <p style={{ color: "#a2acb3", fontSize: 13, margin: "6px 0 0" }}>
        Câu trả lời được lưu tự động. Bấm "Thoát" để tạm dừng: đồng hồ dừng lại và bạn làm tiếp sau. Hết giờ bài sẽ tự nộp.
      </p>
      <article style={{ lineHeight: 1.8, margin: "16px 0 24px", color: "#c3cbd0", whiteSpace: "pre-line" }}>{active.test?.passage}</article>
      {questions.map(question => <fieldset key={question.id} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <legend>{question.question}</legend>
        {question.options.map((option, index) => <label key={index} style={{ display: "flex", gap: 10, padding: 6 }}><input type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => setAnswersBoth({ ...answersRef.current, [question.id]: index })} />{option}</label>)}
      </fieldset>)}
      <button disabled={busy} style={{ padding: "10px 18px", border: 0, borderRadius: 10, background: "#0f766e", color: "white", fontWeight: 700 }}>
        {busy ? "Đang nộp..." : `Nộp bài (${answeredCount(answers, questions)}/${questions.length} câu)`}
      </button>
      <button type="button" disabled={busy} onClick={leave} style={{ marginLeft: 10, padding: "10px 18px", borderRadius: 10 }}>Thoát</button>
    </form> : <section style={{ display: "grid", gap: 12 }}>
      {tests.length === 0 && !status?.milestones?.length && <p style={{ color: "#a2acb3" }}>Bạn chưa đạt cột mốc kiểm tra nào.</p>}
      {(status?.milestones || []).map(item => {
        const pending = tests.find(test => test.id === item.id);
        const waiting = pending?.countdown_seconds || 0;
        const ready = !!pending && waiting === 0;
        const label = item.tested_at ? `Đã làm · ${item.score ?? 0}%`
          : !ready ? `Bài kiểm tra sẽ có sau ${formatHms(waiting)}`
          : item.in_progress ? `Đang làm dở · còn ${formatClock(item.remaining_seconds)}` : "Đã sẵn sàng";
        return <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
          <div><strong>Mốc {item.milestone} từ</strong><p style={{ color: "#a2acb3", margin: "4px 0 0" }}>{label}</p></div>
          {!item.tested_at && <button disabled={busy || !ready} onClick={() => start(item.id)} style={{ padding: "9px 14px", border: 0, borderRadius: 9, background: ready ? "#14b8a6" : "#3d474e", color: "white", cursor: ready ? "pointer" : "default" }}>{!ready ? "Chưa mở" : item.in_progress ? "Tiếp tục" : "Bắt đầu"}</button>}
        </div>;
      })}
    </section>}
  </main>;
}
