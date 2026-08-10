// CTASection.jsx - Đã sửa hoàn chỉnh
import React, { useState } from "react";

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
      className="w-accent h-[550px] relative bg-slate-900 border border-solid border-black"
      aria-labelledby="vocabulary-learning-cta-title"
    >
      <aside
        className="absolute top-[139px] left-[935px] w-[400px] h-[346px] flex flex-col gap-8 bg-amber-50 rounded-3xl border-2 border-solid border-amber-500 shadow-[0px_16px_40px_#f59e0b20]"
        aria-label="Ưu đãi nâng cấp VIP"
      >
        <div className="inline-flex ml-[110px] w-[180px] h-12 relative mt-10 flex-col items-center gap-2">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Bricolage_Grotesque',Helvetica] font-extrabold text-amber-500 text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            VIP TRỌN ĐỜI
          </div>
          <p className="relative w-fit [font-family:'Inter',Helvetica] font-semibold text-slate-500 text-[13px] tracking-[0] leading-[normal]">
            Thanh toán một lần duy nhất
          </p>
        </div>
        <div className="inline-flex ml-[125px] w-[150px] h-[79px] relative flex-col items-center gap-1">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Bricolage_Grotesque',Helvetica] font-extrabold text-slate-900 text-5xl tracking-[0] leading-[normal]">
            1.000đ
          </div>
          <div className="relative w-fit [font-family:'Inter',Helvetica] font-medium text-slate-500 text-sm tracking-[0] leading-[normal] line-through">
            Giá gốc 999.000đ
          </div>
        </div>
        <div className="flex ml-10 mr-10 flex-1 max-h-[75px] relative flex-col w-80 items-start gap-3">
          <button
            type="button"
            className="all-unset box-border flex h-12 px-6 py-0 self-stretch w-full bg-amber-500 rounded-xl items-center justify-center relative cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            aria-label="Nâng cấp VIP ngay"
          >
            <span className="relative w-fit [font-family:'Inter',Helvetica] font-bold text-slate-900 text-[15px] tracking-[0] leading-[normal] whitespace-nowrap">
              Nâng cấp VIP ngay
            </span>
          </button>
          <p className="relative self-stretch [font-family:'Inter',Helvetica] font-normal text-slate-500 text-xs text-center tracking-[0] leading-[normal]">
            Cam kết hoàn tiền trong 7 ngày nếu không hài lòng
          </p>
        </div>
      </aside>
      <div className="flex flex-col w-[720px] items-center gap-4 absolute top-[191px] left-[110px]">
        <h2
          id="vocabulary-learning-cta-title"
          className="relative self-stretch mt-[-1.00px] [font-family:'Lexend_Deca',Helvetica] font-extrabold text-white text-[40px] text-center tracking-[0] leading-[48.0px]"
        >
          Bắt đầu ghi nhớ từ vựng hiệu quả ngay hôm nay
        </h2>
        <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-200 text-base text-center tracking-[0] leading-6">
          Nhập email của bạn để đăng ký tài khoản miễn phí và tham gia học tập
          cùng hơn 50.000 học viên khác.
        </p>
      </div>
      <form
        className="flex w-[500px] items-center gap-3 absolute top-[437px] left-[179px]"
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
          className="flex h-12 items-center px-4 py-0 relative flex-1 grow bg-white rounded-lg [font-family:'Rethink_Sans',Helvetica] font-normal text-slate-900 text-[15px] tracking-[0] leading-[normal] placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        />
        <button
          type="submit"
          className="all-unset box-border inline-flex gap-2 px-6 py-3 flex-[0_0_auto] bg-amber-500 rounded-lg items-center justify-center relative cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <span className="relative w-fit mt-[-1.00px] [font-family:'Rethink_Sans',Helvetica] font-semibold text-indigo-950 text-[15px] tracking-[0] leading-[normal]">
            Đăng ký miễn phí
          </span>
        </button>
      </form>
    </section>
  );
}