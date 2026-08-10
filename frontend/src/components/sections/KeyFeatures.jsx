// KeyFeatures.jsx - Đã sửa hoàn chỉnh
import React from "react";

const learningTools = [
  {
    title: "Không bao giờ quên",
    description:
      "Hệ thống tự động phân tích và nhắc nhở bạn ôn tập chính xác vào thời điểm vàng để tối đa hiệu quả ghi nhớ.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-3.svg",
  },
  {
    title: "Học theo chủ đề",
    description:
      "Hơn 3000+ từ vựng phong phú được chia nhỏ thành nhiều chủ đề thực tế từ đời sống, công sở đến thi cử.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-4.svg",
  },
  {
    title: "Tiến độ rõ ràng",
    description:
      "Biểu đồ thống kê chi tiết mức độ ghi nhớ, giúp bạn kiểm soát sát sao lượng kiến thức đã tích lũy hàng ngày.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-5.svg",
  },
  {
    title: "Động lực mỗi ngày",
    description:
      "Hệ thống huy hiệu, bảng xếp hạng và chuỗi ngày học liên tục (Streak) thú vị giữ lửa nhiệt huyết học tập.",
    icon: "https://c.animaapp.com/zdBS24aH/img/frame-6.svg",
  },
];

export default function LearningToolsFeaturesSection() {
  return (
    <section
      className="flex w-full flex-col items-center gap-12 bg-white px-6 py-16 sm:px-10 lg:px-20 lg:py-24"
      aria-labelledby="learning-tools-heading"
    >
      <header className="relative flex w-full flex-[0_0_auto] flex-col items-center gap-4">
        <p className="relative mt-[-1px] w-full [font-family:'Rethink_Sans',Helvetica] text-center text-sm font-bold leading-[normal] tracking-[0.21px] text-indigo-600">
          TÍNH NĂNG VƯỢT TRỘI
        </p>
        <h2
          id="learning-tools-heading"
          className="relative w-full [font-family:'Lexend_Deca',Helvetica] text-center text-4xl font-bold leading-[43.2px] tracking-[0] text-slate-900"
        >
          Đầy đủ công cụ thông minh cho hành trình học tập
        </h2>
      </header>
      <div className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-6">
        {[learningTools.slice(0, 2), learningTools.slice(2, 4)].map(
          (toolRow, rowIndex) => (
            <div
              key={`learning-tools-row-${rowIndex}`}
              className="relative flex w-full flex-[0_0_auto] flex-col items-start gap-6 sm:flex-row"
            >
              {toolRow.map((tool) => (
                <article
                  key={tool.title}
                  className="relative flex flex-1 grow items-start gap-5 rounded-2xl border border-solid border-slate-200 bg-white p-7 shadow-[0px_6px_16px_#0f172a04]"
                >
                  <img
                    className="relative h-12 w-12 shrink-0"
                    src={tool.icon}
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="relative flex flex-1 grow flex-col items-start gap-2">
                    <h3 className="relative mt-[-1px] w-full [font-family:'Lexend_Deca',Helvetica] text-lg font-bold leading-[normal] tracking-[0] text-slate-900">
                      {tool.title}
                    </h3>
                    <p className="relative w-full [font-family:'Rethink_Sans',Helvetica] text-[15px] font-normal leading-[22.5px] tracking-[0] text-slate-600">
                      {tool.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}