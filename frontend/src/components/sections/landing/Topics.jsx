// Chủ đề từ vựng: khớp bộ folder hệ thống có sẵn (backend/seed.py). Từ minh hoạ lấy đúng từ dữ liệu seed.
import { Link } from 'react-router-dom';
import Section from './Section';
import { useAuth } from '../../../hooks/useAuth';
import { IconLayers, IconGlobe, IconChart, IconSparkles, IconBook, IconTarget } from '../../brand/icons';

const TOPICS = [
  { name: 'Công nghệ', icon: IconLayers, tone: 'brand', words: ['algorithm', 'database', 'network'] },
  { name: 'Du lịch', icon: IconGlobe, tone: 'moss', words: ['itinerary', 'passport', 'luggage'] },
  { name: 'Kinh doanh', icon: IconChart, tone: 'gray', words: ['deadline', 'revenue', 'strategy'] },
  { name: 'Khoa học', icon: IconSparkles, tone: 'brand', words: ['experiment', 'molecule', 'gravity'] },
  { name: 'Ẩm thực', icon: IconBook, tone: 'red', words: ['cuisine', 'recipe', 'simmer'] },
  { name: 'IELTS', icon: IconTarget, tone: 'moss', words: ['mitigate', 'sustainable', 'phenomenon'] },
];

const TONE = {
  brand: { box: 'border-brand-500/30 bg-brand-500/10 text-brand-300', chip: 'bg-brand-500/10 text-brand-200' },
  moss: { box: 'border-moss-500/35 bg-moss-500/10 text-moss-300', chip: 'bg-moss-500/10 text-moss-200' },
  red: { box: 'border-red-500/30 bg-red-500/10 text-red-300', chip: 'bg-red-500/10 text-red-200' },
  gray: { box: 'border-line bg-surface-3 text-ink', chip: 'bg-surface-3 text-ink-muted' },
};

export default function VocabularyTopicsSection() {
  const { isAuthenticated } = useAuth();
  return (
    <Section
      id="chu-de"
      tone="surface"
      eyebrow="Chủ đề"
      title="Bắt đầu từ những chủ đề thiết thực"
      subtitle="Mỗi chủ đề là một folder từ vựng. Bạn cũng có thể tự tạo thư mục riêng từ những từ tra trong từ điển."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map(({ name, icon: Icon, tone, words }) => (
          <article key={name} className="rounded-2xl border border-line bg-bg p-6">
            <div className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl border ${TONE[tone].box}`}><Icon size={24} /></span>
              <h3 className="font-display text-xl font-bold text-ink">{name}</h3>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {words.map((w) => (
                <span key={w} className={`rounded-full px-3 py-1 text-sm font-medium ${TONE[tone].chip}`}>{w}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link to={isAuthenticated ? '/app/thuvien' : '/register'} className="inline-block rounded-xl border border-brand-500/40 px-6 py-3 text-sm font-bold text-brand-200 transition hover:bg-brand-500/10">
          {isAuthenticated ? 'Mở thư viện chủ đề' : 'Tạo tài khoản để học'}
        </Link>
      </div>
    </Section>
  );
}
