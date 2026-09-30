// src/features/learning/LearningSession.jsx
// STT 6.5 - Module cốt lõi, viết lại theo cơ chế mới (4 dạng bài + lặp thông minh).
// Logic lặp nằm ở sessionMachine.js (đã test riêng), file này chỉ lo UI + gọi API.

import { useEffect, useMemo, useRef, useState } from 'react';
import { wordsApi } from '../../api/client';
import { speak } from '../../utils/tts';
import { shuffle, pickRandom } from '../../utils/helpers';
import { initMachine, stepMachine, MAX_LEVEL } from './sessionMachine';

const BATCH_SIZE = 5;
const TYPE_LABEL = { 1: 'Nhập chính tả', 2: 'Trắc nghiệm', 3: 'Dịch từ vựng', 4: 'Nghe' };
const REMIND_DAYS = [1, 3, 7];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Bước lướt từ (chỉ mode="learn") ─────────────────────────────────────────

function BrowseCard({ word, onSkip, onKnown, onLearn }) {
  return (
    <div style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#e8eaf6' }}>
            {word.word}
            {word.pos && <span style={{ fontSize: 14, color: '#8892b0', fontWeight: 500 }}> ({word.pos})</span>}
          </div>
          <div style={{ color: '#8892b0', fontSize: 14, marginTop: 4 }}>{word.phonetic}</div>
        </div>
        <button type="button" onClick={() => speak(word.word)} style={s.speakBtn}>🔊</button>
      </div>

      <div style={{ color: '#e8eaf6', fontSize: 16, marginBottom: 6 }}>{word.meaning}</div>
      {word.examples?.[0] && (
        <div style={{ color: '#8892b0', fontSize: 13.5, lineHeight: 1.5 }}>
          <div>{word.examples[0].en.replace('___', word.word)}</div>
          <div>{word.examples[0].vi}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button type="button" onClick={onSkip} style={{ ...s.btn, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#8892b0' }}>
          Bỏ qua
        </button>
        <button type="button" onClick={onKnown} style={{ ...s.btn, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
          Đã biết
        </button>
        <button type="button" onClick={onLearn} style={{ ...s.btn, flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontWeight: 700 }}>
          Học từ này
        </button>
      </div>
    </div>
  );
}

// ── 4 dạng bài tập ───────────────────────────────────────────────────────────
// Mỗi component nhận: word, pool (để tạo nhiễu trắc nghiệm), onAnswer(correct)

function Type1Spelling({ word, onAnswer }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const ex = useMemo(() => pickRandom(word.examples || [{ en: '___', vi: '' }], 1)[0], [word.id]);

  const submit = () => {
    if (result) return;
    const ok = value.trim().toLowerCase() === word.word.toLowerCase();
    setResult(ok ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(ok), ok ? 300 : 1400);
  };

  return (
    <div style={s.card}>
      <div style={s.typeTag}>Dạng 1 · Nhập chính tả</div>
      <div style={{ color: '#e8eaf6', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{word.meaning}</div>
      <div style={{ color: '#8892b0', fontSize: 14, marginBottom: 18, fontStyle: 'italic' }}>{ex.en} — {ex.vi}</div>
      <input
        autoFocus
        value={value}
        disabled={!!result}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Nhập từ tiếng Anh..."
        style={{ ...s.input, borderColor: result === 'wrong' ? '#f43f5e' : result === 'correct' ? '#10b981' : 'rgba(255,255,255,0.12)' }}
      />
      {result === 'wrong' && <div style={s.wrongHint}>Đáp án đúng: <strong>{word.word}</strong></div>}
      {!result && (
        <button type="button" onClick={submit} disabled={!value.trim()} style={s.submitBtn}>Kiểm tra</button>
      )}
    </div>
  );
}

function Type2ChooseMeaning({ word, pool, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((w) => w.id !== word.id), 3).map((w) => w.meaning);
    return shuffle([word.meaning, ...distractors]);
  }, [word.id]);

  const pick = (opt) => {
    if (picked) return;
    setPicked(opt);
    const ok = opt === word.meaning;
    setTimeout(() => onAnswer(ok), ok ? 300 : 1400);
  };

  return (
    <div style={s.card}>
      <div style={s.typeTag}>Dạng 2 · Trắc nghiệm</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: '#e8eaf6', marginBottom: 18 }}>
        {word.word} <span style={{ fontSize: 13, color: '#8892b0', fontWeight: 500 }}>{word.phonetic}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => pick(opt)} style={optStyle(opt, picked, opt === word.meaning)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Type3ChooseWord({ word, pool, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((w) => w.id !== word.id), 3).map((w) => w.word);
    return shuffle([word.word, ...distractors]);
  }, [word.id]);

  const pick = (opt) => {
    if (picked) return;
    setPicked(opt);
    const ok = opt === word.word;
    setTimeout(() => onAnswer(ok), ok ? 300 : 1400);
  };

  return (
    <div style={s.card}>
      <div style={s.typeTag}>Dạng 3 · Dịch từ vựng</div>
      <div style={{ color: '#e8eaf6', fontSize: 17, fontWeight: 700, marginBottom: 18 }}>{word.meaning}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => pick(opt)} style={optStyle(opt, picked, opt === word.word)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Type4Listening({ word, onAnswer }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const played = useRef(false);

  useEffect(() => {
    if (!played.current) { speak(word.word); played.current = true; }
  }, [word.id]);

  const submit = () => {
    if (result) return;
    const ok = value.trim().toLowerCase() === word.word.toLowerCase();
    setResult(ok ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(ok), ok ? 300 : 1400);
  };

  return (
    <div style={s.card}>
      <div style={s.typeTag}>Dạng 4 · Nghe</div>
      <button type="button" onClick={() => speak(word.word)} style={{ ...s.speakBtn, width: '100%', height: 64, fontSize: 26, marginBottom: 18 }}>
        🔊 Nghe lại
      </button>
      <input
        autoFocus
        value={value}
        disabled={!!result}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Nghe và gõ lại từ..."
        style={{ ...s.input, borderColor: result === 'wrong' ? '#f43f5e' : result === 'correct' ? '#10b981' : 'rgba(255,255,255,0.12)' }}
      />
      {result === 'wrong' && <div style={s.wrongHint}>Đáp án đúng: <strong>{word.word}</strong></div>}
      {!result && (
        <button type="button" onClick={submit} disabled={!value.trim()} style={s.submitBtn}>Kiểm tra</button>
      )}
    </div>
  );
}

// ── Popup sau khi trả lời đúng ────────────────────────────────────────────────

function CorrectPopup({ word, onContinue, onRemindLater, onSkipForever }) {
  const [pickingDays, setPickingDays] = useState(false);
  return (
    <div style={s.card}>
      <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>✅ Chính xác!</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: '#e8eaf6' }}>{word.word}</div>
      <div style={{ color: '#8892b0', fontSize: 14, marginBottom: 4 }}>{word.meaning}</div>
      {word.examples?.[0] && (
        <div style={{ color: '#8892b0', fontSize: 13, fontStyle: 'italic', marginTop: 6 }}>
          {word.examples[0].en.replace('___', word.word)}
        </div>
      )}

      {!pickingDays ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setPickingDays(true)} style={{ ...s.btn, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#8892b0', fontSize: 12.5 }}>
            Nhắc nhở sau X ngày
          </button>
          <button type="button" onClick={onSkipForever} style={{ ...s.btn, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e', fontSize: 12.5 }}>
            Bỏ qua từ này
          </button>
          <button type="button" onClick={onContinue} style={{ ...s.btn, flex: 1, minWidth: 100, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontWeight: 700 }}>
            Tiếp tục
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {REMIND_DAYS.map((d) => (
            <button key={d} type="button" onClick={() => onRemindLater(d)} style={{ ...s.btn, flex: 1, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}>
              {d} ngày
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component chính ───────────────────────────────────────────────────────────

export function LearningSession({ folder, mode, dailyGoal, wordsLearned, onWordComplete, onBack }) {
  // Danh sách từ cố định cho cả phiên (không đổi khi re-render)
  const sessionWords = useRef(folder.words.slice(0, dailyGoal || folder.words.length)).current;
  const batches = useRef(chunk(sessionWords, BATCH_SIZE)).current;
  const pool = folder.words; // nguồn tạo nhiễu trắc nghiệm - dùng cả folder cho đa dạng

  const [batchIdx, setBatchIdx] = useState(0);
  const [phase, setPhase] = useState(mode === 'learn' ? 'browse' : 'exercise');
  const [browseIdx, setBrowseIdx] = useState(0);
  const [workingBatch, setWorkingBatch] = useState(() => (mode === 'learn' ? [] : batches[0] || []));
  const [machine, setMachine] = useState(() => (mode === 'review' ? initMachine(batches[0] || []) : null));
  const [showPopup, setShowPopup] = useState(false);
  const wrongCounts = useRef({}); // wordId -> tổng số lần sai trong cả phiên (gửi lên backend)

  const currentBatch = batches[batchIdx] || [];

  const bumpWrong = (wordId) => { wrongCounts.current[wordId] = (wrongCounts.current[wordId] || 0) + 1; };

  const finishWord = (word, opts = {}) => {
    if (mode === 'learn') {
      wordsApi.completeLearn(word.id).catch((err) => console.error('completeLearn lỗi:', err));
    } else {
      wordsApi.completeReview(word.id, { wrong_count: wrongCounts.current[word.id] || 0, choice: opts.choice })
        .catch((err) => console.error('completeReview lỗi:', err));
    }
    onWordComplete?.();
  };

  const startExerciseBatch = (words) => {
    if (words.length === 0) {
      goNextBatch();
      return;
    }
    setWorkingBatch(words);
    setMachine(initMachine(words));
    setPhase('exercise');
  };

  const goNextBatch = () => {
    const next = batchIdx + 1;
    if (next >= batches.length) {
      setPhase('sessionDone');
      return;
    }
    setBatchIdx(next);
    setBrowseIdx(0);
    if (mode === 'learn') {
      setWorkingBatch([]); // tránh lẫn từ đã hoàn thành ở batch trước vào batch mới
      setPhase('browse');
    } else {
      startExerciseBatch(batches[next] || []);
    }
  };

  // ── Bước lướt từ ──
  const handleBrowseAction = (action) => {
    const word = currentBatch[browseIdx];
    let nextWorkingBatch = workingBatch;

    if (action === 'skip' || action === 'known') {
      if (action === 'known') word.lv = 1; // học ngay LV1, không qua bài tập
      finishWord(word);
    } else if (action === 'learn') {
      nextWorkingBatch = [...workingBatch, word];
      setWorkingBatch(nextWorkingBatch);
    }

    const nextIdx = browseIdx + 1;
    if (nextIdx < currentBatch.length) {
      setBrowseIdx(nextIdx);
    } else {
      // Hết batch lướt -> bắt đầu bài tập với các từ đã chọn "Học từ này"
      startExerciseBatch(nextWorkingBatch);
    }
  };

  // ── Trả lời bài tập ──
  const handleAnswer = (correct) => {
    const word = workingBatch.find((w) => w.id === currentWordId);
    if (!correct) bumpWrong(word.id);
    if (correct) {
      setShowPopup(true);
    } else {
      advanceMachine(word.id, false, false);
    }
  };

  const advanceMachine = (wordId, correct, removed, choice) => {
    if (removed) {
      const w = workingBatch.find((x) => x.id === wordId);
      if (w) finishWord(w, { choice });
    }
    const batchNow = workingBatch.filter((w) => w.id !== wordId || !removed);
    const res = stepMachine(machine, { wordId, correct, removed, batch: batchNow });
    setWorkingBatch(batchNow);
    setShowPopup(false);
    if (res.done) {
      // Mọi từ còn lại đều đã qua đủ 4 dạng -> tính là hoàn thành
      batchNow.forEach((w) => finishWord(w));
      goNextBatch();
    } else {
      setMachine(res.state);
    }
  };

  const currentWordId = machine?.remaining[0]?.id;
  const currentWord = workingBatch.find((w) => w.id === currentWordId);

  // ── Render ──
  if (phase === 'sessionDone' || sessionWords.length === 0) {
    return (
      <div style={{ ...s.wrap, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#8892b0' }}>Đang hoàn tất phiên học...</div>
      </div>
    );
  }

  if (phase === 'browse') {
    const word = currentBatch[browseIdx];
    if (!word) { goNextBatch(); return null; }
    return (
      <div style={s.wrap}>
        <ProgressBar done={wordsLearned} total={dailyGoal} label={`Lướt từ ${browseIdx + 1}/${currentBatch.length}`} />
        <BrowseCard
          key={word.id}
          word={word}
          onSkip={() => handleBrowseAction('skip')}
          onKnown={() => handleBrowseAction('known')}
          onLearn={() => handleBrowseAction('learn')}
        />
      </div>
    );
  }

  if (phase === 'exercise' && currentWord) {
    if (showPopup) {
      return (
        <div style={s.wrap}>
          <ProgressBar done={wordsLearned} total={dailyGoal} label={TYPE_LABEL[machine.level]} />
          <CorrectPopup
            word={currentWord}
            onContinue={() => advanceMachine(currentWord.id, true, false)}
            onRemindLater={(days) => advanceMachine(currentWord.id, true, true, `remind_${days}d`)}
            onSkipForever={() => advanceMachine(currentWord.id, true, true, 'skip_forever')}
          />
        </div>
      );
    }
    const commonProps = { key: `${currentWord.id}-${machine.level}-${machine.seq}`, word: currentWord, pool, onAnswer: handleAnswer };
    return (
      <div style={s.wrap}>
        <ProgressBar done={wordsLearned} total={dailyGoal} label={TYPE_LABEL[machine.level]} />
        {machine.level === 1 && <Type1Spelling {...commonProps} />}
        {machine.level === 2 && <Type2ChooseMeaning {...commonProps} />}
        {machine.level === 3 && <Type3ChooseWord {...commonProps} />}
        {machine.level === 4 && <Type4Listening {...commonProps} />}
      </div>
    );
  }

  return null;
}

function ProgressBar({ done, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div style={{ maxWidth: 480, margin: '0 auto 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8892b0', marginBottom: 6 }}>
        <span>{label}</span>
        <span>{done}/{total} từ</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
      </div>
    </div>
  );
}

function optStyle(opt, picked, isCorrect) {
  let bg = 'rgba(255,255,255,0.03)', border = '1px solid rgba(255,255,255,0.08)', color = '#e8eaf6';
  if (picked) {
    if (opt === picked) {
      bg = isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
      border = `1px solid ${isCorrect ? '#10b981' : '#f43f5e'}`;
    } else if (isCorrect) {
      bg = 'rgba(16,185,129,0.1)';
      border = '1px solid rgba(16,185,129,0.3)';
    }
  }
  return { textAlign: 'left', padding: '12px 14px', borderRadius: 10, background: bg, border, color, fontSize: 14.5, cursor: picked ? 'default' : 'pointer' };
}

const s = {
  wrap: { width: '100%', maxWidth: 520, margin: '0 auto', padding: '24px 16px' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22 },
  btn: { padding: '11px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' },
  speakBtn: { width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#c7d2fe', cursor: 'pointer' },
  typeTag: { fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid', color: '#e8eaf6', fontSize: 15, outline: 'none', marginBottom: 10 },
  wrongHint: { color: '#f43f5e', fontSize: 13, marginBottom: 10 },
  submitBtn: { width: '100%', padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' },
};
