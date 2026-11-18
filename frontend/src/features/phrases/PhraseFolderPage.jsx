import { useMemo, useState } from 'react';
import { PHRASE_GROUPS, PHRASE_ALL_ID, groupById, toPracticeWords } from './phrasesData';
import FlashcardsMode from '../practice/FlashcardsMode.jsx';
import QuizMode from '../practice/QuizMode.jsx';
import { SpeakButton } from '../practice/ModeShell.jsx';
import { PRIMARY_BTN, SECONDARY_BTN } from '../practice/modeStyles.js';

export default function PhraseFolderPage({ groupId, onBack }) {
  const [mode, setMode] = useState('list');   // list | flash | quiz
  const all = groupId === PHRASE_ALL_ID;
  const groups = all ? PHRASE_GROUPS : [groupById(groupId)].filter(Boolean);
  const phrases = useMemo(() => groups.flatMap((g) => g.phrases), [groupId]);   // eslint-disable-line react-hooks/exhaustive-deps
  const words = useMemo(() => toPracticeWords(phrases, all ? 'all' : groupId), [phrases, all, groupId]);

  if (!groups.length) {
    return <div><button style={SECONDARY_BTN} onClick={onBack}>← Thư viện</button><p style={{ color: '#a2acb3' }}>Không tìm thấy folder cụm từ này.</p></div>;
  }
  if (mode === 'flash') return <FlashcardsMode words={words} onExit={() => setMode('list')} />;
  if (mode === 'quiz') return <QuizMode words={words} onExit={() => setMode('list')} />;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <button style={{ ...SECONDARY_BTN, padding: '8px 14px', fontSize: 13 }} onClick={onBack}>← Thư viện</button>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9', margin: '14px 0 4px' }}>
        💬 {all ? 'Tất cả folder cụm từ' : groups[0].name}
      </h2>
      <p style={{ color: '#a2acb3', marginTop: 0 }}>{all ? 'Collocations, idioms và phrasal verbs theo chủ đề' : groups[0].desc} · {phrases.length} cụm</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 20px' }}>
        <button style={PRIMARY_BTN} onClick={() => setMode('flash')}>🃏 Học bằng thẻ nhanh</button>
        <button style={SECONDARY_BTN} onClick={() => setMode('quiz')}>⚡ Làm trắc nghiệm</button>
      </div>
      {groups.map((g) => (
        <section key={g.id} style={{ marginBottom: 24 }}>
          {all && <h3 style={{ fontFamily: 'Outfit, sans-serif', color: g.color, fontSize: 16, margin: '0 0 10px' }}>{g.name} · {g.phrases.length} cụm</h3>}
          <div style={{ display: 'grid', gap: 10 }}>
            {g.phrases.map((p) => (
              <div key={p.phrase} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <SpeakButton text={p.phrase} label="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: '#f4f6f7' }}>{p.phrase}</div>
                  <div style={{ color: '#99f6e4', marginTop: 2 }}>{p.meaning}</div>
                  <div style={{ color: '#a2acb3', fontSize: 13.5, marginTop: 6, fontStyle: 'italic' }}>{p.en}</div>
                  <div style={{ color: '#a2acb3', fontSize: 13 }}>{p.vi}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
