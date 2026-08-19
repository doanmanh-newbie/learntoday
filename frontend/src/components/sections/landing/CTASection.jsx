// CTASection.jsx - Viết lại bằng flex/grid responsive thay vì absolute positioning cố định theo khung 1440px
import { useState } from "react";

export default function VocabularyLearningCtaSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    event.currentTarget.reset();
    setEmail("");
  };

  return (
    <section
      className="relative flex w-full flex-col items-center gap-12 border border-solid border-black bg-slate-900 px-6 py-16 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-20 lg:py-24"
      aria-labelledby="vocabulary-learning-cta-title"
    >
      <div className="flex w-full max-w-[720px] flex-col items-center gap-8 text-center lg:items-start lg:text-left">
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <h2
            id="vocabulary-learning-cta-title"
            className="relative w-full [font-family:'Lexend_Deca',Helvetica] text-3xl font-extrabold leading-[1.15] tracking-[0] text-white sm:text-4xl lg:text-[40px] lg:leading-[48px]"
          >
            Bắt đầu ghi nhớ từ vựng hiệu quả ngay hôm nay
          </h2>
          <p className="relative w-full [font-family:'Rethink_Sans',Helvetica] text-base font-normal leading-6 tracking-[0] text-slate-200">
            Nhập email của bạn để đăng ký tài khoản miễn phí và tham gia học tập
            cùng hơn 50.000 học viên khác.
          </p>
        </div>

        <form
          className="flex w-full max-w-[500px] flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          onSubmit={handleSubmit}
        >
          <label htmlFor="learning-email" className="sr-only">
            Email của bạn
          </label>
          <input
            id="learning-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Nhập email của bạn..."
            required
            autoComplete="email"
            className="flex h-12 min-w-0 flex-1 items-center rounded-lg bg-white px-4 py-0 [font-family:'Rethink_Sans',Helvetica] text-[15px] font-normal leading-[normal] tracking-[0] text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          />
          <button
            type="submit"
            className="all-unset box-border inline-flex flex-[0_0_auto] cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <span className="relative mt-[-1.00px] w-fit whitespace-nowrap [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-indigo-950">
              Đăng ký miễn phí
            </span>
          </button>
        </form>
      </div>

      <aside
        className="flex w-full max-w-[400px] flex-col items-center gap-6 rounded-3xl border-2 border-solid border-amber-500 bg-amber-50 px-6 py-8 shadow-[0px_16px_40px_#f59e0b20] sm:px-10"
        aria-label="Ưu đãi nâng cấp VIP"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="relative w-fit [font-family:'Bricolage_Grotesque',Helvetica] text-xl font-extrabold leading-[normal] tracking-[0] text-amber-500 whitespace-nowrap">
            VIP TRỌN ĐỜI
          </div>
          <p className="relative w-fit [font-family:'Inter',Helvetica] text-[13px] font-semibold leading-[normal] tracking-[0] text-slate-500">
            Thanh toán một lần duy nhất
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="relative w-fit [font-family:'Bricolage_Grotesque',Helvetica] text-5xl font-extrabold leading-[normal] tracking-[0] text-slate-900">
            1.000đ
          </div>
          <div className="relative w-fit [font-family:'Inter',Helvetica] text-sm font-medium leading-[normal] tracking-[0] text-slate-500 line-through">
            Giá gốc 999.000đ
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-3">
          <button
            type="button"
            className="all-unset box-border flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-amber-500 px-6 py-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            aria-label="Nâng cấp VIP ngay"
          >
            <span className="relative w-fit whitespace-nowrap [font-family:'Inter',Helvetica] text-[15px] font-bold leading-[normal] tracking-[0] text-slate-900">
              Nâng cấp VIP ngay
            </span>
          </button>
          <p className="relative w-full text-center [font-family:'Inter',Helvetica] text-xs font-normal leading-[normal] tracking-[0] text-slate-500">
            Cam kết hoàn tiền trong 7 ngày nếu không hài lòng
          </p>
        </div>
      </aside>
    </section>
  );
}
