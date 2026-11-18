// Luyện "Từ hay sai": danh mục tự gom (không phải folder), từ sai càng nhiều càng hay xuất hiện; trả lời sai thì gặp lại sau 3 câu.
import { useEffect, useMemo, useState } from 'react';
import { historyApi } from '../../api/client';
import { toUiWord } from '../../api/adapters';
import { DISTRACTOR_BANK } from '../learning/distractorBank';
import { meaningChoices, sameText } from '../learning/quizChoices';
import { buildHardQueue, requeue } from './hardWords';
import { ModeShell, SpeakButton, RoundSummary } from './ModeShell.jsx';
import { PRIMARY_BTN, SECONDARY_BTN } from './modeStyles.js';

const ROUND = 15;

export default function HardWordsMode({ words: pool = [], onExit }) {
  const [state, setState] = useState({ loading: true, error: '', list: [] });
  const [run, setRun] = useState(null);           // { queue, pos, correct, answered, picked }

  useEffect(() => {
    let alive = true;
    historyApi.hardWords(30)
      .then((res) => alive && setState({ loading: false, error: '', list: (res.words || []).map((w) => ({ ...toUiWord(w), wrong_count: w.wrong_count, correct_count: w.correct_count })) }))
      .catch((e) => alive && setState({ loading: false, error: e?.message || 'Không tải được danh mục.', list: [] }));
    return () => { alive = false; };
  }, []);

  const start = () => setRun({ queue: buildHardQueue(state.list, Math.min(ROUND, Math.max(state.list.length * 3, 5))), pos: 0, correct: 0, answered: 0, picked: null });
  const word = run?.queue[run.pos];
  const distractors = useMemo(() => [...state.list, ...pool, ...DISTRACTOR_BANK], [state.list, pool]);
  const choices = useMemo(() => (word ? meaningChoices(word, distractors) : []), [word, run?.pos]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (state.loading) return <ModeShell title="Từ hay sai" icon="❗" onExit={onExit}><p style={{ color: '#a2acb3' }}>Đang tải…</p></ModeShell>;

  if (!run) {
    return (
      <ModeShell title="Từ hay sai" icon="❗" onExit={onExit}>
        {state.error && <p style={{ color: '#fca5a5' }}>⚠️ {state.error}</p>}
        {state.list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 40 }}>🌱</div>
            <p style={{ color: '#dde2e5' }}>Chưa có từ nào bị sai. Khi học hoặc ôn mà làm sai, từ đó sẽ tự vào danh mục này.</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#a2acb3', marginTop: 0 }}>{state.list.length} từ hay sai. Từ sai càng nhiều sẽ xuất hiện càng thường xuyên; trả lời sai thì gặp lại ngay sau 3 câu.</p>
            <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
              {state.list.map((w) => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 2px', borderBottom: '0.8px solid rgba(255,255,255,0.06)', fontSize: 14 }}>
                  <span style={{ color: '#f1f5f9' }}><b>{w.word}</b> <span style={{ color: '#a2acb3' }}>· {w.meaning}</span></span>
                  <span style={{ color: '#fca5a5', whiteSpace: 'nowrap' }}>sai {w.wrong_count}</span>
                </div>
              ))}
            </div>
            <button style={PRIMARY_BTN} onClick={start}>Bắt đầu luyện ({Math.min(ROUND, Math.max(state.list.length * 3, 5))} câu)</button>
          </>
        )}
      </ModeShell>
    );
  }

  if (!word) {
    return (
      <ModeShell title="Từ hay sai" icon="❗" onExit={onExit}>
        <RoundSummary correct={run.correct} total={run.answered} extra="Câu sai đã được lặp lại trong lượt." onAgain={start} onExit={onExit} />
      </ModeShell>
    );
  }

  const answer = (choice) => {
    if (run.picked) return;
    const ok = sameText(choice, word.meaning);
    setRun((r) => ({ ...r, picked: choice, answered: r.answered + 1, correct: r.correct + (ok ? 1 : 0),
      queue: ok ? r.queue : requeue(r.queue, r.pos, word, 3) }));
  };
  const next = () => setRun((r) => ({ ...r, pos: r.pos + 1, picked: null }));

  return (
    <ModeShell title="Từ hay sai" icon="❗" progress={`${run.pos + 1}/${run.queue.length}`} onExit={onExit}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: '#f1f5f9' }}>{word.word}</div>
        <div style={{ margin: '8px 0 18px' }}><SpeakButton text={word.word} /></div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {choices.map((c) => {
          const right = run.picked && sameText(c, word.meaning);
          const wrong = run.picked === c && !right;
          return (
            <button key={c} type="button" onClick={() => answer(c)}
              style={{ ...SECONDARY_BTN, textAlign: 'left', borderColor: right ? '#22c55e' : wrong ? '#ef4444' : undefined,
                background: right ? 'rgba(34,197,94,0.15)' : wrong ? 'rgba(239,68,68,0.15)' : SECONDARY_BTN.background }}>{c}</button>
          );
        })}
      </div>
      {run.picked && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          {!sameText(run.picked, word.meaning) && <p style={{ color: '#fca5a5', margin: '0 0 10px' }}>Đáp án: {word.meaning}. Từ này sẽ quay lại sau 3 câu.</p>}
          <button style={PRIMARY_BTN} onClick={next} autoFocus>Tiếp →</button>
        </div>
      )}
    </ModeShell>
  );
}
