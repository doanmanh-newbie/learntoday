// AIPractice.jsx - Đã sửa hoàn chỉnh
import React, { useState } from "react";

const featureItems = [
  {
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-7.svg",
    text: "Luyện đặt câu tùy ý với từ vựng vừa học",
  },
  {
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-8.svg",
    text: "AI phân tích ngữ pháp, thang điểm và góp ý cải thiện chi tiết",
  },
  {
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-9.svg",
    text: "5 cấp độ từ A1 (Căn bản) lên tới IELTS / TOEIC nâng cao",
  },
  {
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-10.svg",
    text: "2 chế độ linh hoạt: Dịch Việt → Anh hoặc Anh → Việt",
  },
];

export default function AiSentenceCorrectionSection() {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <section
      className="relative flex h-[620px] w-[1440px] flex-col items-center gap-12 bg-[linear-gradient(112deg,rgba(30,27,75,1)_0%,rgba(46,16,101,1)_100%),linear-gradient(0deg,rgba(30,27,75,1)_0%,rgba(30,27,75,1)_100%)] px-20 py-24"
      aria-labelledby="ai-sentence-correction-heading"
    >
      {/* Phần còn lại giữ nguyên */}
      <div className="relative flex w-full flex-[0_0_auto] items-center gap-12 self-stretch">
        <div className="relative flex flex-1 grow flex-col items-start gap-8">
          <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-3 self-stretch">
            <div className="relative inline-flex flex-[0_0_auto] items-start rounded-[99px] border border-solid border-amber-500 bg-[#f59e0b20] px-3 py-1">
              <p className="relative mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-xs font-bold leading-[normal] tracking-[0] text-amber-500">
                ⚡ ĐỘC QUYỀN TRÊN LEARN TODAY
              </p>
            </div>
            <h2
              id="ai-sentence-correction-heading"
              className="relative self-stretch [font-family:'Lexend_Deca',Helvetica] text-[40px] font-extrabold leading-[48px] tracking-[0] text-white"
            >
              Đặt câu &amp; Sửa lỗi AI tức thì
            </h2>
            <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] text-base font-normal leading-6 tracking-[0] text-purple-300">
              Không chỉ nhớ mặt chữ, hãy áp dụng từ vựng vào ngữ cảnh thực tế
              với hệ thống phản hồi trí tuệ nhân tạo thế hệ mới.
            </p>
          </div>
          <ul className="relative flex w-full flex-[0_0_auto] list-none flex-col items-start gap-4 self-stretch p-0">
            {featureItems.map((feature) => (
              <li
                key={feature.text}
                className="relative flex w-full flex-[0_0_auto] items-center gap-4 self-stretch"
              >
                <img
                  className="relative h-8 w-8"
                  alt=""
                  aria-hidden="true"
                  src={feature.icon}
                />
                <span className="relative flex-1 [font-family:'Rethink_Sans',Helvetica] text-base font-medium leading-[normal] tracking-[0] text-white">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setIsStarted(true)}
            className="relative inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            aria-label="Bắt đầu luyện ngay cùng AI"
          >
            <img
              className="relative h-[18px] w-[18px]"
              alt=""
              aria-hidden="true"
              src="https://c.animaapp.com/zdBS24aH/img/cpu.svg"
            />
            <span className="relative mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[15px] font-semibold leading-[normal] tracking-[0] text-indigo-950">
              {isStarted
                ? "Đã sẵn sàng luyện cùng AI"
                : "Bắt đầu luyện ngay cùng AI"}
            </span>
          </button>
        </div>
        <article
          className="relative flex flex-1 grow flex-col items-start gap-6 rounded-[20px] border border-solid border-violet-900 bg-[#1e1e38] p-8 shadow-[0px_12px_24px_#00000040]"
          aria-label="Ví dụ phản hồi từ Learn Today AI"
        >
          <header className="relative flex w-full flex-[0_0_auto] items-center justify-between self-stretch">
            <div
              className="relative inline-flex flex-[0_0_auto] items-center gap-2"
              aria-hidden="true"
            >
              <span className="relative h-3 w-3 rounded-md bg-red-500" />
              <span className="relative h-3 w-3 rounded-md bg-amber-500" />
              <span className="relative h-3 w-3 rounded-md bg-emerald-500" />
            </div>
            <p className="relative mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[13px] font-normal leading-[normal] tracking-[0] text-violet-400">
              Learn Today AI Engine v2.0
            </p>
          </header>
          <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-2.5 self-stretch">
            <p className="relative mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[13px] font-bold leading-[normal] tracking-[0] text-indigo-400">
              TỪ KHÓA MỤC TIÊU
            </p>
            <div className="relative inline-flex flex-[0_0_auto] items-center gap-2">
              <strong className="relative mt-[-1px] w-fit [font-family:'Lexend_Deca',Helvetica] text-xl font-bold leading-[normal] tracking-[0] text-white">
                Accumulate
              </strong>
              <span className="relative w-fit [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-400">
                /əˈkjuːmjəleɪt/ (verb): Tích lũy
              </span>
            </div>
          </div>
          <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-2 rounded-lg border border-solid border-indigo-600 bg-[#111122] p-4 self-stretch">
            <p className="relative mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-[13px] font-bold leading-[normal] tracking-[0] text-indigo-400">
              Câu bạn đặt
            </p>
            <blockquote className="relative m-0 self-stretch [font-family:'Rethink_Sans',Helvetica] text-[15px] font-normal italic leading-[normal] tracking-[0] text-slate-200">
              &quot;I want to accumulate more experiences before apply for this
              job.&quot;
            </blockquote>
          </div>
          <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-3 rounded-lg border border-solid border-emerald-500 bg-[#152b23] p-4 self-stretch">
            <div className="relative flex w-full flex-[0_0_auto] items-center justify-between self-stretch">
              <div className="relative inline-flex flex-[0_0_auto] items-center gap-2">
                <img
                  className="relative h-[18px] w-[18px]"
                  alt=""
                  aria-hidden="true"
                  src="https://c.animaapp.com/zdBS24aH/img/check.svg"
                />
                <p className="relative mt-[-1px] w-fit [font-family:'Rethink_Sans',Helvetica] text-sm font-bold leading-[normal] tracking-[0] text-emerald-500">
                  Đánh giá từ AI (9.0/10)
                </p>
              </div>
              <span className="relative inline-flex flex-[0_0_auto] items-start rounded bg-[#10b98120] px-2 py-0.5 [font-family:'Rethink_Sans',Helvetica] text-[11px] font-bold leading-[normal] tracking-[0] text-emerald-500">
                Đã Sửa
              </span>
            </div>
            <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-200">
              Góp ý: Thay đổi &quot;before apply&quot; thành{" "}
              <strong className="font-bold text-emerald-500">
                &quot;before applying&quot;
              </strong>{" "}
              vì sau giới từ cần dùng V-ing.
            </p>
            <p className="relative self-stretch [font-family:'Rethink_Sans',Helvetica] text-sm font-normal leading-[normal] tracking-[0] text-slate-200">
              <em>💡 &quot;I want to accumulate more experiences before </em>
              <strong className="font-bold text-emerald-500">applying</strong>
              <em> for this job.&quot;</em>
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}