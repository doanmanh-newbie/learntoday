// Luyện câu cùng AI. Khung bên phải là VÍ DỤ MINH HOẠ định dạng phản hồi của AI (không phải kết quả thật).
import Section from './Section';
import { IconSparkles, IconCheck } from '../../brand/icons';

function Ring({ label, score }) {
  const color = score >= 8 ? '#a3bd6a' : score >= 6 ? '#2dd4bf' : '#f87171';
  const r = 20, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[54px] w-[54px]">
        <svg width="54" height="54" className="-rotate-90" aria-hidden="true">
          <circle cx="27" cy="27" r={r} fill="none" stroke="#262c31" strokeWidth="4" />
          <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 10)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

const POINTS = [
  'AI soạn câu theo trình độ từ A1 đến IELTS, hoặc theo từ trong folder của bạn.',
  'Chấm công bằng với mọi cách dịch đúng, không chỉ khớp một đáp án mẫu.',
  'Chỉ ra từng lỗi, giải thích bằng tiếng Việt và đưa câu đã sửa.',
];

export default function AiSentenceCorrectionSection() {
  return (
    <Section id="luyen-cau-ai" eyebrow="Luyện câu cùng AI" title="Dịch một câu, nhận phản hồi như có giáo viên bên cạnh">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <ul className="space-y-5">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-500/20 text-moss-300"><IconCheck size={16} /></span>
                <span className="text-base leading-relaxed text-ink-muted">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-300"><IconSparkles size={16} /> Phản hồi của AI</span>
            <span className="text-xs text-ink-subtle">Ví dụ minh hoạ</span>
          </div>
          <p className="text-xs text-ink-subtle">Đề (tiếng Việt)</p>
          <p className="font-display text-lg font-bold text-ink">Kỷ luật giúp tôi tập trung học tập.</p>
          <p className="mt-4 text-xs text-ink-subtle">Bài làm của bạn</p>
          <p className="rounded-xl border border-line bg-bg px-4 py-3 text-ink">Discipline <span className="text-red-400 line-through">help</span> me focus on study.</p>

          <div className="mt-5 flex justify-around rounded-xl bg-bg py-4">
            <Ring label="Ngữ pháp" score={7} />
            <Ring label="Từ vựng" score={8} />
            <Ring label="Tự nhiên" score={7} />
          </div>

          <div className="mt-5 rounded-xl border border-moss-500/30 bg-moss-500/10 px-4 py-3">
            <p className="text-xs font-semibold text-moss-300">Câu đã sửa</p>
            <p className="mt-1 text-ink">Discipline <b className="text-moss-300">helps</b> me focus on my studies.</p>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-bg px-4 py-3 text-sm">
            <span className="mr-2 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">Ngữ pháp</span>
            <span className="text-red-400 line-through">help</span> → <span className="font-semibold text-moss-300">helps</span>
            <p className="mt-1.5 text-ink-muted">Chủ ngữ “Discipline” là số ít nên động từ thêm -s.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
