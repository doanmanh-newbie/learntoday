// src/pages/WordDetailPage.jsx
// Trang chi tiết từ - dữ liệu THẬT: từ điển trực tuyến + bản dịch tiếng Việt, được lưu sẵn trong database
// (backend: GET /api/dictionary/lookup). Mọi nghĩa của mọi loại từ; lưu vào thư mục qua POST /api/dictionary/save.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SaveModal from "../components/sections/dashboard/SaveModal";
import { speak } from "../utils/tts";
import { dictionaryApi, foldersApi } from "../api/client";
import { toUiEntry } from "../api/adapters";
import useAutoTranslate from "../hooks/useAutoTranslate";

const TAB_ANH_VIET = { id: "anh-viet", label: "ANH - VIỆT" };
const TAB_ANH_ANH = { id: "anh-anh", label: "ANH - ANH" };
const TAB_DONG_NGHIA = { id: "dong-nghia", label: "ĐỒNG / TRÁI NGHĨA" };
const TAB_THANH_NGU = { id: "thanh-ngu", label: "THÀNH NGỮ" };
const TAB_CHUYEN_NGANH = { id: "chuyen-nganh", label: "CHUYÊN NGÀNH" };

/** Chỉ hiện tab có nội dung: từ điển tích hợp có thành ngữ/chuyên ngành nhưng không có định nghĩa tiếng Anh hay đồng nghĩa. */
function tabsFor(entry) {
  const hasEnglish = entry.meanings.some((m) => m.definitions.some((d) => d.en));
  const hasSynonyms = entry.meanings.some((m) => m.synonyms.length || m.antonyms.length);
  const tabs = [TAB_ANH_VIET];
  if (hasEnglish) tabs.push(TAB_ANH_ANH);
  if (hasSynonyms || entry.origin !== "lexicon") tabs.push(TAB_DONG_NGHIA);
  if (entry.idioms.length) tabs.push(TAB_THANH_NGU);
  if (entry.domains.length) tabs.push(TAB_CHUYEN_NGANH);
  return tabs;
}

const roundBtn = {
  display: "inline-flex", alignItems: "center", gap: 4, height: 36, padding: "0 12px", borderRadius: 18, cursor: "pointer",
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#99f6e4", fontSize: 12, fontWeight: 700,
};

function playAudio(url, word, voice) {
  if (url) {
    const audio = new Audio(url);
    audio.play().catch(() => speak(word, voice));     // file lỗi/bị chặn -> đọc bằng giọng máy
  } else {
    speak(word, voice);
  }
}

export default function WordDetailPage({ word }) {
  const [activeTab, setActiveTab] = useState("anh-viet");
  const [nonce, setNonce] = useState(0);               // tăng để tra lại (nút "Thử lại")
  const reqKey = `${word}|${nonce}`;
  // result.key cho biết kết quả thuộc yêu cầu nào -> "đang tải" suy ra được, không cần setState đồng bộ trong effect
  const [result, setResult] = useState({ key: null, status: "loading", entry: null, message: "", savedFolderIds: [], source: "" });
  const [folders, setFolders] = useState([]);
  const [showSave, setShowSave] = useState(false);
  const [toast, setToast] = useState("");
  const [didYouMean, setDidYouMean] = useState([]);

  useEffect(() => {
    let cancelled = false;
    dictionaryApi.lookup(word)
      .then((res) => {
        if (cancelled) return;
        setResult({ key: reqKey, status: "ok", entry: toUiEntry(res.entry), message: "", savedFolderIds: res.saved_folder_ids || [], source: res.source });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          key: reqKey, status: err.status === 404 ? "notfound" : "error", entry: null, savedFolderIds: [], source: "",
          message: err.message || "Không tra được từ này.",
        });
      });
    return () => { cancelled = true; };
  }, [word, reqKey]);

  // Danh sách thư mục cá nhân (để chọn nơi lưu)
  useEffect(() => {
    let cancelled = false;
    foldersApi.list().then((data) => {
      if (cancelled) return;
      setFolders((data.personal_folders || []).map((f) => ({
        id: f.id, name: f.name, color: f.color || "#14b8a6", words: Array(f.word_count || 0).fill(null),
      })));
    }).catch(() => { /* chưa tải được thì modal chỉ cho tạo thư mục mới */ });
    return () => { cancelled = true; };
  }, []);

  // Không tìm thấy -> gợi ý từ gần giống
  const notFound = result.key === reqKey && result.status === "notfound";
  useEffect(() => {
    if (!notFound) return undefined;
    let cancelled = false;
    dictionaryApi.suggest(word.slice(0, Math.max(2, word.length - 2)))
      .then((res) => { if (!cancelled) setDidYouMean((res.suggestions || []).filter((s) => s !== word.toLowerCase())); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [notFound, word]);

  const handleSave = async (folderId) => {
    const res = await dictionaryApi.save({ word: result.entry.word, folder_id: folderId });
    setResult((r) => ({ ...r, savedFolderIds: [...new Set([...r.savedFolderIds, folderId])] }));
    setToast(res.already_saved ? `"${result.entry.word}" đã có trong thư mục này rồi` : `Đã lưu "${result.entry.word}" vào thư mục`);
    setTimeout(() => setToast(""), 2200);
  };

  const handleCreate = async (name) => {
    const created = await foldersApi.create(name);
    setFolders((prev) => [...prev, { id: created.folder.id, name: created.folder.name, color: created.folder.color || "#14b8a6", words: [] }]);
    return created.folder.id;
  };

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  const loading = result.key !== reqKey;
  const tr = useAutoTranslate(result.status === "ok" ? result.entry : null);

  const back = (
    <div style={{ marginBottom: 16 }}>
      <Link to="/app/dictionary" style={{ color: "#5eead4", textDecoration: "none", fontSize: 14 }}>← Quay lại từ điển</Link>
    </div>
  );

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {back}
        <div style={{ padding: 40, textAlign: "center", color: "#a2acb3" }}>
          <p style={{ margin: 0 }}>Đang tra từ “{word}”...</p>
          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#a2acb3" }}>Lần đầu tra một từ có thể mất vài giây (từ đó sẽ được lưu lại để lần sau hiện ngay).</p>
        </div>
      </div>
    );
  }

  if (result.status === "notfound") {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {back}
        <div style={{ padding: 40, textAlign: "center", color: "#a2acb3" }}>
          <h2 style={{ color: "#f4f6f7" }}>Không tìm thấy từ “{word}”</h2>
          <p>Hãy kiểm tra chính tả, hoặc thử tra dạng gốc của từ (ví dụ “run” thay vì “running”).</p>
          {didYouMean.length > 0 && (
            <p style={{ marginTop: 20 }}>
              Có phải bạn muốn tìm:{" "}
              {didYouMean.map((s) => (
                <Link key={s} to={`/app/dictionary/${encodeURIComponent(s)}`} style={{ color: "#5eead4", marginRight: 12, fontWeight: 600 }}>{s}</Link>
              ))}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {back}
        <div role="alert" style={{ padding: 32, textAlign: "center", color: "#fecaca", borderRadius: 14, background: "rgba(127,29,29,0.3)", border: "1px solid rgba(248,113,113,0.35)" }}>
          <p style={{ margin: "0 0 14px" }}>⚠️ {result.message}</p>
          <button onClick={retry} style={{ padding: "8px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, background: "#f87171", color: "#450a0a" }}>Thử lại</button>
        </div>
      </div>
    );
  }

  const { entry } = result;
  const saved = result.savedFolderIds.length;
  const tabs = tabsFor(entry);
  // Tab đang chọn có thể không tồn tại ở từ này (vd: từ trước có "Thành ngữ", từ này không) -> về tab đầu có nội dung
  const fallbackTab = entry.meanings.length === 0 && entry.domains.length ? TAB_CHUYEN_NGANH.id : TAB_ANH_VIET.id;
  const tab = tabs.some((t) => t.id === activeTab) ? activeTab : fallbackTab;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {back}

      {/* Header từ */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <h1 style={{ color: "#ffffff", fontSize: 36, fontWeight: 900, margin: 0 }}>{entry.word}</h1>
        {entry.phonetic && <span style={{ color: "#a2acb3", fontSize: 18 }}>{entry.phonetic}</span>}
        <button aria-label="Nghe giọng Anh-Anh" onClick={() => playAudio(entry.audio.uk, entry.word, "en-GB")} style={roundBtn}>🔊 UK</button>
        <button aria-label="Nghe giọng Anh-Mỹ" onClick={() => playAudio(entry.audio.us, entry.word, "en-US")} style={roundBtn}>🔊 US</button>
        <button
          onClick={() => setShowSave(true)}
          style={{
            marginLeft: "auto", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
            background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.35)", color: "#5eead4",
          }}
        >
          {saved ? `✓ Đã lưu (${saved} thư mục) · Lưu thêm` : "💾 Lưu vào thư mục"}
        </button>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#a2acb3" }}>
        {result.source === "lexicon"
          ? "Từ điển Anh–Việt tích hợp"
          : result.source === "database" ? "Dữ liệu từ kho từ vựng đã lưu" : "Vừa tra từ điển trực tuyến và đã lưu vào kho từ vựng"}
      </p>
      {(entry.redirectedFrom || entry.matchedFrom) && (
        <p role="note" style={{ margin: "0 0 12px", fontSize: 13, color: "#99f6e4" }}>
          {entry.redirectedFrom
            ? <>“{entry.redirectedFrom}” là dạng khác của <b>{entry.word}</b>.</>
            : <>Không có mục “{entry.matchedFrom}”, đang hiển thị dạng gốc <b>{entry.word}</b>.</>}
        </p>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.1)", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 16px", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
              borderBottom: tab === t.id ? "3px solid #14b8a6" : "3px solid transparent",
              color: tab === t.id ? "#ffffff" : "#a2acb3", fontSize: 14, fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chips loại từ */}
      <div style={{ padding: "16px 0 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {entry.meanings.map((m) => (
          <span key={m.pos} style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid #14b8a6", color: "#5eead4", fontSize: 14, fontWeight: 600 }}>
            {m.posLabel} <span style={{ opacity: 0.6, fontWeight: 400 }}>({m.pos})</span>
          </span>
        ))}
      </div>

      <div style={{ paddingTop: 8 }}>
        {tab === "anh-viet" && entry.meanings.length === 0 && (
          <p style={{ color: "#a2acb3" }}>Từ này chỉ có nghĩa chuyên ngành trong từ điển.</p>
        )}
        {tab === "anh-viet" && entry.meanings.map((m) => (
          <div key={m.pos} style={{ marginBottom: 24 }}>
            <p style={{ color: "#ffffff", fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>
              {m.posLabel}
              {m.note && <span style={{ color: "#a2acb3", fontSize: 13, fontWeight: 500, marginLeft: 10 }}>{m.note}</span>}
            </p>
            {m.definitions.map((d, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                {(d.vi || tr.vi(d.en))
                  ? <>
                      <p style={{ color: "#2dd4bf", fontSize: 15.5, margin: "0 0 2px" }}>✧ {d.vi || tr.vi(d.en)}</p>
                      {!d.vi && <p style={{ color: "#848f97", fontSize: 13, margin: "0 0 4px 16px" }}>{d.en}</p>}
                    </>
                  : <p style={{ color: "#a2acb3", fontSize: 14.5, margin: "0 0 4px", fontStyle: "italic" }}>✧ {d.en}{" "}
                      <span style={{ fontSize: 12 }}>
                        {tr.status === "loading" ? "(đang dịch…)" : (
                          <>(chưa dịch · <button type="button" onClick={tr.retry} style={{ border: "none", background: "none", padding: 0, color: "#5eead4", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>dịch lại</button>)</>
                        )}
                      </span>
                    </p>}
                {d.examples.map((ex, k) => (
                  <div key={k} style={{ marginLeft: 20, marginBottom: 4 }}>
                    <p style={{ color: "#14b8a6", fontSize: 14, margin: "0 0 2px", fontWeight: 500 }}>{ex.en}</p>
                    {(ex.vi || tr.vi(ex.en)) && <p style={{ color: "#a2acb3", fontSize: 13, margin: 0 }}>{ex.vi || tr.vi(ex.en)}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {tab === "anh-anh" && entry.meanings.map((m) => (
          <div key={m.pos} style={{ marginBottom: 20 }}>
            <p style={{ color: "#ffffff", fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>{m.pos}</p>
            {m.definitions.map((d, i) => (
              d.en && <p key={i} style={{ color: "#e9edef", fontSize: 15, margin: "0 0 8px", lineHeight: 1.6 }}>{i + 1}. {d.en}</p>
            ))}
          </div>
        ))}

        {tab === "dong-nghia" && (
          entry.meanings.every((m) => !m.synonyms.length && !m.antonyms.length)
            ? <p style={{ color: "#a2acb3" }}>Từ điển chưa có từ đồng nghĩa / trái nghĩa cho từ này.</p>
            : entry.meanings.filter((m) => m.synonyms.length || m.antonyms.length).map((m) => (
              <div key={m.pos} style={{ marginBottom: 22 }}>
                <p style={{ color: "#ffffff", fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{m.posLabel}</p>
                {[["Đồng nghĩa", m.synonyms, "#a3bd6a"], ["Trái nghĩa", m.antonyms, "#f87171"]].map(([label, list, color]) => list.length > 0 && (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <span style={{ color, fontWeight: 700, fontSize: 13, marginRight: 10 }}>{label}:</span>
                    {list.map((w) => (
                      <Link key={w} to={`/app/dictionary/${encodeURIComponent(w)}`}
                        style={{ display: "inline-block", margin: "0 8px 6px 0", padding: "3px 12px", borderRadius: 14, fontSize: 13.5, color: "#e9edef", textDecoration: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {w}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ))
        )}
      </div>

      {tab === "thanh-ngu" && (
        <div style={{ paddingTop: 8 }}>
          {entry.idioms.map((idiom) => (
            <div key={idiom.phrase} style={{ marginBottom: 18 }}>
              <p style={{ color: "#ffffff", fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>{idiom.phrase}</p>
              {idiom.meanings.map((m, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <p style={{ color: "#2dd4bf", fontSize: 15, margin: "0 0 2px" }}>✧ {m.vi}</p>
                  {(m.examples || []).map((ex, k) => (
                    <p key={k} style={{ color: "#a2acb3", fontSize: 13, margin: "0 0 2px 20px" }}>{ex.en}{ex.vi ? ` — ${ex.vi}` : ""}</p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "chuyen-nganh" && (
        <div style={{ paddingTop: 8 }}>
          {entry.domains.map((d, i) => (
            <div key={`${d.field}-${d.sub || ""}-${i}`} style={{ marginBottom: 16 }}>
              <p style={{ color: "#ffffff", fontSize: 15, fontWeight: 800, margin: "0 0 6px", textTransform: "capitalize" }}>
                {d.field}{d.sub ? ` · ${d.sub}` : ""}
              </p>
              {d.meanings.map((m) => (
                <p key={m} style={{ color: "#e9edef", fontSize: 14.5, margin: "0 0 4px", lineHeight: 1.55 }}>• {m}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {showSave && (
        <SaveModal wordOrText={entry.word} folders={folders} onSave={handleSave} onClose={() => setShowSave(false)} onCreate={handleCreate} />
      )}

      {toast && (
        <div role="status" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: 12,
          background: "rgba(134,162,77,0.15)", border: "1px solid rgba(134,162,77,0.4)", color: "#86a24d", fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(134,162,77,0.25)", zIndex: 2000,
        }}>
          ✅ {toast}
        </div>
      )}

      <style>{`
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn { from { opacity:0; transform: scale(0.93) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
