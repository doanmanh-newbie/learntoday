// Khung chung cho mọi khối của trang giới thiệu: cùng bề rộng, khoảng cách, kiểu tiêu đề.
export default function Section({ id, eyebrow, title, subtitle, children, tone = 'bg', className = '' }) {
  return (
    <section id={id} className={`scroll-mt-20 ${tone === 'surface' ? 'bg-surface' : 'bg-bg'} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {(eyebrow || title) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-300">{eyebrow}</p>}
            {title && <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h2>}
            {subtitle && <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
