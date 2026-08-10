// src/pages/Landing.jsx
import React from "react";

// Import các component đã sửa
import SiteHeaderSection from "../components/sections/Header";
import SiteFooterSection from "../components/sections/Footer";
import VocabularyLearningHeroSection from "../components/sections/HeroSection";
import ForgettingProblemSolutionSection from "../components/sections/ProblemSolution";
import LearningResultsSection from "../components/sections/UserResults";
import VocabularyLearningFeaturesSection from "../components/sections/KeyFeatures";
import AiSentenceCorrectionSection from "../components/sections/AIPractice";
import SpacedRepetitionProcessSection from "../components/sections/LearningLoop";
import VocabularyTopicLibrarySection from "../components/sections/Topics";
import VocabularyLibraryStatsSection from "../components/sections/Stats";
import AdditionalTopicCardsSection from "../components/sections/TopicCards";
import VocabularyLearningCtaSection from "../components/sections/CTASection";

// Menu điều hướng
const primaryNavigationItems = [
  { label: "Học từ vựng", href: "#hoc-tu-vung", widthClass: "w-[90px]" },
  { label: "Chủ đề từ vựng", href: "#chu-de-tu-vung", widthClass: "w-[109px]" },
  { label: "Viết lại câu", href: "#viet-lai-cau", widthClass: "w-[76px]" },
];

const secondaryNavigationItems = [
  { label: "Top user", href: "#top-user", widthClass: "w-[59px]" },
  { label: "Chuỗi học 🔥", href: "#chuoi-hoc", widthClass: "w-[89px]" },
];

export default function LearnTodayLanding() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white overflow-x-hidden">
      {/* Header + Navigation */}
      <header>
        <SiteHeaderSection />
        <nav
          aria-label="Điều hướng chính"
          className="flex w-full flex-wrap items-center gap-x-8 gap-y-2 overflow-x-auto border border-solid border-slate-200 bg-white px-4 sm:px-8 lg:px-20"
        >
          <div className="flex items-center gap-8">
            {primaryNavigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex h-14 flex-col items-start justify-center"
              >
                <span className="[font-family:'Rethink_Sans-Medium',Helvetica] text-[15px] font-medium leading-[normal] tracking-[0] text-slate-600 whitespace-nowrap">
                  {item.label}
                </span>
              </a>
            ))}
          </div>

          <div
            aria-hidden="true"
            className="hidden h-14 w-px flex-col items-center justify-center bg-slate-200 sm:flex sm:ml-auto"
          />
          <div className="flex items-center gap-6">
            {secondaryNavigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex h-14 flex-col items-start justify-center"
              >
                <span className="[font-family:'Rethink_Sans-Medium',Helvetica] text-[15px] font-medium leading-[normal] tracking-[0] text-slate-600 whitespace-nowrap">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        <section id="hoc-tu-vung">
          <VocabularyLearningHeroSection />
        </section>
        <section aria-label="Vấn đề quên từ vựng và giải pháp">
          <ForgettingProblemSolutionSection />
        </section>
        <section aria-label="Kết quả học tập">
          <LearningResultsSection />
        </section>
        <section aria-label="Tính năng học từ vựng">
          <VocabularyLearningFeaturesSection />
        </section>
        <section id="viet-lai-cau">
          <AiSentenceCorrectionSection />
        </section>
        <section aria-label="Quy trình lặp lại ngắt quãng">
          <SpacedRepetitionProcessSection />
        </section>
        <section id="chu-de-tu-vung">
          <VocabularyTopicLibrarySection />
        </section>
        <section aria-label="Danh mục chủ đề từ vựng">
          <VocabularyLibraryStatsSection />
        </section>
        <section aria-label="Mẫu chủ đề từ vựng">
          <AdditionalTopicCardsSection />
        </section>
        <section aria-label="Bắt đầu học từ vựng">
          <VocabularyLearningCtaSection />
        </section>
      </main>

      <footer>
        <SiteFooterSection />
      </footer>
    </div>
  );
}

