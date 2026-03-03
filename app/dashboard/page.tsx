import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

          .nexus-metric-card {
            position: relative;
            border-radius: 16px;
            padding: 1px;
            background: linear-gradient(135deg, rgba(124,92,252,0.35) 0%, rgba(244,113,181,0.12) 50%, rgba(124,92,252,0.08) 100%);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .nexus-metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(124,92,252,0.18);
          }
          .nexus-metric-inner {
            border-radius: 15px;
            padding: 24px;
            background: #0f0f1e;
            height: 100%;
            position: relative;
            overflow: hidden;
          }
          .nexus-metric-inner::before {
            content: '';
            position: absolute;
            top: 0; left: 50%; transform: translateX(-50%);
            height: 1px; width: 60%;
            background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5), transparent);
          }
          .nexus-metric-glow {
            position: absolute;
            bottom: -20px; right: -20px;
            width: 80px; height: 80px;
            border-radius: 50%;
            background: rgba(124,92,252,0.08);
            filter: blur(20px);
            pointer-events: none;
          }
        `}</style>

        <section
          style={{
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 32,
            fontFamily: "'DM Sans', sans-serif",
            minHeight: "100%",
          }}
        >
          {/* Header */}
          <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Eyebrow */}
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#7c5cfc",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Overview
            </p>

            <h1
              style={{
                margin: 0,
                fontFamily: "'Syne', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "#eeeaf8",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Dashboard
            </h1>
            {data.user.plan && (
              <p
                style={{
                  margin: 4,
                  fontSize: 13,
                  color: "#7c5cfc",
                  fontWeight: 500,
                }}
              >
                Plan: {data.user.plan}
              </p>
            )}

            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#7a7499",
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            >
              Overview of your workspace activity.
            </p>

            {/* Divider */}
            <div
              style={{
                marginTop: 8,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(124,92,252,0.3), rgba(244,113,181,0.1), transparent)",
              }}
            />
          </header>

          {/* Metrics grid — ALL DATA LOGIC UNTOUCHED */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {data.metrics.map((m) => (
              <div key={m.label} className="nexus-metric-card">
                <div className="nexus-metric-inner">
                  <div className="nexus-metric-glow" />

                  {/* Label */}
                  <p
                    style={{
                      margin: "0 0 12px",
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#6b6890",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {m.label}
                  </p>

                  {/* Value */}
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 32,
                      fontWeight: 700,
                      color: "#eeeaf8",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {m.value}
                  </p>

                  {/* Helper */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#4b4870",
                      fontWeight: 300,
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {m.helper}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unauthorized")) {
      redirect("/auth/signin");
    }

    throw error;
  }
}
