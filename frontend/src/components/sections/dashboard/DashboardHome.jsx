// Trang chủ: MỘT việc nên làm bây giờ + kế hoạch hôm nay + luyện tập nhanh + tiến độ.
import { nextStep, planSteps, progressPercent, QUICK_PRACTICE } from "./homeLogic";
import LearningPath from "../../../features/path/LearningPath.jsx";
import { PRACTICE_MODE_META, randomMode, readLastMode } from "../../../features/practice/modes";

const card = { borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" };

function ProgressRing({ percent, label, sub }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 132, height: 132, margin: "0 auto" }}>
      <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={`Hoàn thành ${percent}% mục tiêu hôm nay`}>
        <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="66" cy="66" r={r} fill="none" stroke="#2dd4bf" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 66 66)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <b style={{ fontFamily: "Outfit, sans-serif", fontSize: 24, color: "#f1f5f9" }}>{label}</b>
        <span style={{ fontSize: 11, color: "#a2acb3" }}>{sub}</span>
      </div>
    </div>
  );
}

export default function DashboardHome({ username, dueCount, wordsLearnedToday, learnTarget, stats, minutes, onStartReview, onGoLearn, onOpenPractice }) {
  const step = nextStep({ dueCount, learnedToday: wordsLearnedToday, target: learnTarget, totalLearned: stats.totalLearned });
  const plan = planSteps({ dueCount, learnedToday: wordsLearnedToday, target: learnTarget });
  const percent = progressPercent(wordsLearnedToday, learnTarget);
  const act = () => {
    if (step.key === "review") onStartReview();
    else if (step.key === "practice") onOpenPractice();
    else onGoLearn();
  };
  const quick = PRACTICE_MODE_META.filter((m) => QUICK_PRACTICE.includes(m.id));

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0,1fr)" }} className="lg:grid-cols-[minmax(0,1fr)_320px]">
      <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
        <section style={{ ...card, padding: "clamp(20px,4vw,32px)", border: "1px solid rgba(45,212,191,0.3)", background: "rgba(45,212,191,0.06)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#99f6e4" }}>Chào {username} 👋 · Việc nên làm bây giờ</p>
          <h1 style={{ margin: "8px 0 6px", fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px,4vw,30px)", color: "#f1f5f9" }}>{step.title}</h1>
          <p style={{ margin: "0 0 18px", color: "#a2acb3" }}>{step.hint}</p>
          <button onClick={act} style={{ padding: "14px 28px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 16,
            fontFamily: "Outfit, sans-serif", color: "#fff", background: "linear-gradient(135deg,#0f766e,#0e8077)", boxShadow: "0 0 22px rgba(45,212,191,0.45)" }}>
            {step.cta} →
          </button>
        </section>

        <LearningPath totalLearned={stats.totalLearned} />

        <section style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 12px", fontFamily: "Outfit, sans-serif", fontSize: 16, color: "#f1f5f9" }}>Kế hoạch hôm nay</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {plan.map((p) => (
              <li key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, color: p.done ? "#a3d977" : "#e9edef" }}>
                <span aria-hidden>{p.done ? "✅" : "⬜"}</span>{p.label}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={{ margin: "0 0 12px", fontFamily: "Outfit, sans-serif", fontSize: 16, color: "#f1f5f9" }}>Luyện tập nhanh</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
            {quick.map((m) => (
              <button key={m.id} type="button" onClick={() => onOpenPractice(m.id)}
                style={{ ...card, padding: 16, textAlign: "left", cursor: "pointer", color: "#e9edef" }}>
                <div style={{ fontSize: 26 }}>{m.icon}</div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, marginTop: 4 }}>{m.title}</div>
              </button>
            ))}
            <button type="button" onClick={() => onOpenPractice(randomMode(readLastMode()))}
              style={{ ...card, padding: 16, textAlign: "left", cursor: "pointer", color: "#99f6e4", border: "1px dashed rgba(45,212,191,0.4)" }}>
              <div style={{ fontSize: 26 }}>🎲</div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, marginTop: 4 }}>Ngẫu nhiên</div>
            </button>
          </div>
        </section>
      </div>

      <aside style={{ ...card, padding: 20, alignSelf: "start", display: "grid", gap: 16 }}>
        <ProgressRing percent={percent} label={`${wordsLearnedToday}/${learnTarget}`} sub="từ mới hôm nay" />
        <dl style={{ margin: 0, display: "grid", gap: 10, fontSize: 14 }}>
          {[["🔥 Chuỗi ngày", `${stats.streak} ngày`], ["📚 Đã học", `${stats.totalLearned} từ`], ["🎯 Chính xác", `${stats.accuracy}%`], ["⏱ Hôm nay", `${minutes} phút`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", color: "#a2acb3" }}><dt>{k}</dt><dd style={{ margin: 0, color: "#f1f5f9", fontWeight: 700 }}>{v}</dd></div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
