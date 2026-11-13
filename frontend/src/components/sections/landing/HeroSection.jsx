// Khối đầu trang: thông điệp chính + thẻ từ vựng minh hoạ (vẽ bằng CSS, không dùng ảnh ngoài).
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { IconArrowRight, IconVolume, IconFlame, IconCheck } from '../../brand/icons';

const FACTS = [
  ['6', 'cấp độ ôn tập ngắt quãng'],
  ['4', 'dạng bài cho mỗi từ'],
  ['3', 'tiêu chí AI chấm câu'],
  ['Anh – Việt', 'từ điển tích hợp'],
];

function FlashcardDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-label="Minh hoạ thẻ từ vựng">
      <div aria-hidden className="absolute inset-0 -z-10 scale-95 rounded-[2rem] bg-brand-500/20 blur-3xl" />
      <div className="rounded-3xl border border-line bg-surface p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 font-semibold text-brand-300">📘 Cấp 3 · Gần thuộc</span>
          <span className="text-ink-subtle">Ví dụ minh hoạ</span>
        </div>
        <p className="mt-6 font-display text-5xl font-extrabold tracking-tight text-ink">accomplish</p>
        <div className="mt-2 flex items-center gap-3 text-ink-muted">
          <span>/əˈkʌmplɪʃ/</span>
          <span className="rounded-md bg-surface-3 px-2 py-0.5 text-xs font-semibold text-brand-300">động từ</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-300"><IconVolume size={16} /></span>
        </div>
        <p className="mt-5 text-lg text-ink">hoàn thành, đạt được</p>
        <p className="mt-2 text-sm italic text-ink-muted">“She accomplished all her goals.”</p>

        <div className="mt-7">
          <div className="mb-1.5 flex justify-between text-xs text-ink-subtle"><span>Tiến độ chủ đề</span><span>64%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-brand-500 to-moss-400" />
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -top-5 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-surface px-4 py-2.5 text-sm font-bold text-red-300 shadow-xl sm:-right-8">
        <IconFlame size={18} /> 7 ngày liên tiếp
      </div>
      <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-2xl border border-moss-500/35 bg-surface px-4 py-2.5 text-sm font-bold text-moss-300 shadow-xl sm:-left-8">
        <IconCheck size={18} /> Đã ôn 12 từ hôm nay
      </div>
    </div>
  );
}

export default function VocabularyLearningHeroSection() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="relative overflow-hidden bg-bg">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-brand-500/10 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-red-500/[0.07] blur-[120px]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-2 lg:pt-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-moss-400" /> Học từ vựng bằng lặp lại ngắt quãng
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Học từ vựng tiếng Anh, <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">nhớ thật lâu</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            Học từ mới theo chủ đề, ôn lại đúng lúc sắp quên và luyện đặt câu cùng AI biết chấm điểm, chỉ lỗi và sửa câu cho bạn.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to={isAuthenticated ? '/app' : '/register'} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-7 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_rgba(15,118,110,0.4)] transition hover:bg-brand-600">
              {isAuthenticated ? 'Vào ứng dụng' : 'Bắt đầu học'} <IconArrowRight size={18} />
            </Link>
            <a href="#cach-hoat-dong" className="rounded-xl border border-line px-6 py-3.5 text-base font-semibold text-ink transition hover:bg-surface-2">
              Xem cách hoạt động
            </a>
          </div>
        </div>
        <FlashcardDemo />
      </div>

      <div className="relative border-y border-line bg-surface/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-5 py-8 sm:px-8 lg:grid-cols-4">
          {FACTS.map(([value, label]) => (
            <div key={label} className="text-center">
              <dt className="font-display text-3xl font-extrabold text-brand-300">{value}</dt>
              <dd className="mt-1 text-sm text-ink-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
