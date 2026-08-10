// UserResults.jsx - Đã sửa hoàn chỉnh
import React from "react";

const learningResults = [
  {
    value: "15 phút",
    title: "Mỗi ngày",
    description:
      "Nhớ đến 90% từ vựng sau 30 ngày nhờ tối ưu hóa chu kỳ nhắc nhở thông minh.",
  },
  {
    value: "3 Lần",
    title: "Ghi nhớ lâu hơn",
    description:
      "Phương pháp Spaced Repetition khoa học giúp chuyển hóa từ vựng từ trí nhớ ngắn hạn sang dài hạn.",
  },
  {
    value: "50.000+",
    title: "Học viên thành công",
    description:
      "Cộng đồng người học Việt Nam đã cải thiện vượt bậc phản xạ tiếng Anh chỉ sau thời gian ngắn.",
  },
];

export default function LearningResultsSection() {
  return (
    <section
      className="flex w-full h-[500px] relative flex-col items-center gap-12 px-20 py-24 bg-slate-50"
      aria-labelledby="learning-results-heading"
    >
      <header className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <p className="relative self-stretch mt-[-1.00px] [font-family:'Rethink_Sans-Bold',Helvetica] font-bold text-indigo-600 text-sm text-center tracking-[0.21px] leading-[normal]">
          KẾT QUẢ THỰC TẾ
        </p>
        <h2
          id="learning-results-heading"
          className="relative self-stretch [font-family:'Lexend_Deca-Bold',Helvetica] font-bold text-slate-900 text-4xl text-center tracking-[0] leading-[43.2px]"
        >
          Chứng minh hiệu quả qua các con số
        </h2>
      </header>
      <div className="flex items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
        {learningResults.map((result) => (
          <article
            key={result.title}
            className="flex flex-col items-start gap-4 p-8 relative flex-1 grow bg-white rounded-2xl border border-solid border-slate-200 shadow-[0px_4px_12px_#0f172a08]"
          >
            <div className="w-fit mt-[-1.00px] [font-family:'Lexend_Deca-ExtraBold',Helvetica] font-extrabold text-indigo-600 text-[40px] relative tracking-[0] leading-[normal]">
              {result.value}
            </div>
            <h3 className="relative w-fit [font-family:'Lexend_Deca-Bold',Helvetica] font-bold text-slate-900 text-lg tracking-[0] leading-[normal]">
              {result.title}
            </h3>
            <p className="relative self-stretch [font-family:'Rethink_Sans-Regular',Helvetica] font-normal text-slate-600 text-[15px] tracking-[0] leading-[22.5px]">
              {result.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}