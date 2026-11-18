// Bài test trình độ đầu vào: khoảng 3 phút, kết quả ghi vào Trang cá nhân và gợi ý giai đoạn lộ trình nên bắt đầu.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { STAGES } from '../path/learningPath';
import { initPlacement, answerPlacement, placementResult, questionFor, PLACEMENT_LEVELS } from './placement';

const LEVEL_LABEL = { A1: 'A1 · Sơ cấp', B1: 'B1 · Trung cấp', B2: 'B2 · Trung cấp cao', C1: 'C1 · Cao cấp', IELTS: 'IELTS 8.0+' };
const wrap = { maxWidth: 620, margin: '0 auto', padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '0.8px solid rgba(255,255,255,0.08)' };
const btn = { padding: '12px 26px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#0f766e,#0e8077)' };
const choiceBtn = { textAlign: 'left', padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 15, color: '#e9edef', background: 'rgba(255,255,255,0.05)', border: '0.8px solid rgba(255,255,255,0.12)' };

export default function PlacementTest() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [started, setStarted] = useState(false);
  const [state, setState] = useState(initPlacement);
  const [picked, setPicked] = useState(null);
  const [save, setSave] = useState({ status: 'idle', message: '' });
  const question = useMemo(() => (state.done ? null : questionFor(state)), [state]);

  const finish = async (final) => {
    const { level } = placementResult(final);
    setSave({ status: 'saving', message: '' });
    try {
      const res = await profileApi.update({ level, level_source: 'test' });
      if (res?.user) updateUser(res.user);
      setSave({ status: 'ok', message: 'Đã ghi trình độ vào Trang cá nhân.' });
    } catch (e) {
      setSave({ status: 'error', message: e.message || 'Không lưu được kết quả.' });
    }
  };

  const choose = (c) => {
    if (picked) return;
    setPicked(c);
    const ok = c === question.answer;
    setTimeout(() => {
      const next = answerPlacement(state, ok, question.id);
      setPicked(null);
      setState(next);
      if (next.done) finish(next);
    }, 650);
  };

  if (!started) {
    return (
      <div style={wrap}>
        <h1 style={{ margin: '0 0 8px', fontFamily: 'Outfit, sans-serif', fontSize: 26, color: '#f4f6f7' }}>🧭 Test trình độ đầu vào</h1>
        <p style={{ color: '#a2acb3' }}>Khoảng 3 phút, tối đa 15 câu chọn nghĩa từ dễ đến khó ({PLACEMENT_LEVELS.join(' → ')}). Không biết thì cứ đoán, bài sẽ tự dừng ở mức phù hợp. Kết quả được ghi vào Trang cá nhân.</p>
        <button style={btn} onClick={() => setStarted(true)}>Bắt đầu</button>
      </div>
    );
  }

  if (state.done) {
    const { level, stageIndex } = placementResult(state);
    const stage = STAGES[stageIndex];
    return (
      <div style={{ ...wrap, textAlign: 'center' }}>
        <div style={{ fontSize: 52 }}>🎯</div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#f4f6f7', margin: '6px 0' }}>Trình độ của bạn: {LEVEL_LABEL[level]}</h2>
        <p style={{ color: '#dde2e5' }}>Gợi ý bắt đầu từ <b>giai đoạn {stage.id}: {stage.name}</b> ({stage.goal.toLowerCase()}). Chủ đề nên học: {stage.folders.join(', ')}.</p>
        <p style={{ color: save.status === 'error' ? '#fca5a5' : '#86efac', fontSize: 14 }}>{save.status === 'saving' ? 'Đang lưu…' : save.message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={btn} onClick={() => navigate('/app/thuvien')}>Chọn chủ đề để học →</button>
          <button style={{ ...choiceBtn, padding: '12px 20px' }} onClick={() => { setState(initPlacement()); setSave({ status: 'idle', message: '' }); }}>Làm lại</button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a2acb3', fontSize: 13, marginBottom: 14 }}>
        <span>Câu {state.answered + 1}</span><span>Mức {question.level}</span>
      </div>
      <p style={{ color: '#a2acb3', margin: '0 0 4px' }}>Nghĩa của từ:</p>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: '#f4f6f7', marginBottom: 18 }}>{question.prompt}</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {question.choices.map((c) => {
          const right = picked && c === question.answer;
          const wrong = picked === c && !right;
          return (
            <button key={c} type="button" onClick={() => choose(c)}
              style={{ ...choiceBtn, borderColor: right ? '#22c55e' : wrong ? '#ef4444' : choiceBtn.border,
                background: right ? 'rgba(34,197,94,0.15)' : wrong ? 'rgba(239,68,68,0.15)' : choiceBtn.background }}>{c}</button>
          );
        })}
      </div>
    </div>
  );
}
