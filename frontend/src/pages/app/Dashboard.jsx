import { useState, useEffect } from "react";
import Header from "../../components/sections/dashboard/Header.jsx";
import Nav from "../../components/sections/dashboard/Nav.jsx";
import WelcomeSection from "../../components/sections/dashboard/WelcomeSection.jsx";
import StatCards from "../../components/sections/dashboard/StatCards.jsx";
import AIAssistant from "../../components/sections/dashboard/AIAssistant.jsx";
import TopicLibrary from "../../components/sections/dashboard/TopicLibrary.jsx";
import SentencePracticeFull from "../../components/sections/dashboard/SentencePracticeFull.jsx";
import StatisticsPage from "../../components/sections/dashboard/StatisticsPage.jsx"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [minutes, setMinutes] = useState(45);

  useEffect(() => {
    const id = setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ background: "#07091a", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background ambient orbs */}
      <div
        className="orb"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: -150,
          background:
            "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          bottom: -100,
          right: -100,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb animate-float"
        style={{
          width: 300,
          height: 300,
          top: "30%",
          right: "20%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          animationDuration: "5s",
        }}
      />

      <Header minutes={minutes} />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main
        className="relative z-10 px-6 py-8"
        style={{ maxWidth: 960, margin: "0 auto" }}
      >
        {activeTab === "dashboard" && (
            <>
            <WelcomeSection />
            <StatCards />
            <AIAssistant />
          </>
        )}
        {activeTab === "thongke" && < StatisticsPage /> 
        
        }

        {activeTab === "thuvien" && <TopicLibrary />}

        {activeTab === "datcau" && <SentencePracticeFull />}

        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
