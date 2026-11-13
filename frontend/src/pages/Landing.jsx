// src/pages/Landing.jsx - trang giới thiệu
import SiteHeaderSection from '../components/sections/landing/Header';
import VocabularyLearningHeroSection from '../components/sections/landing/HeroSection';
import ForgettingProblemSolutionSection from '../components/sections/landing/ProblemSolution';
import VocabularyLearningFeaturesSection from '../components/sections/landing/KeyFeatures';
import SpacedRepetitionProcessSection from '../components/sections/landing/LearningLoop';
import AiSentenceCorrectionSection from '../components/sections/landing/AIPractice';
import VocabularyTopicsSection from '../components/sections/landing/Topics';
import CallToActionSection from '../components/sections/landing/CTASection';
import SiteFooterSection from '../components/sections/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg font-body text-ink">
      <SiteHeaderSection />
      <main>
        <VocabularyLearningHeroSection />
        <ForgettingProblemSolutionSection />
        <VocabularyLearningFeaturesSection />
        <SpacedRepetitionProcessSection />
        <AiSentenceCorrectionSection />
        <VocabularyTopicsSection />
        <CallToActionSection />
      </main>
      <SiteFooterSection />
    </div>
  );
}
