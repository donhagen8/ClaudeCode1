"use client";

interface ProgressBarProps {
  label?: string;
}

export default function ProgressBar({ label = "Processing…" }: ProgressBarProps) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div
        style={{
          width: "100%",
          height: "4px",
          backgroundColor: "#2d3447",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "#00b894",
            borderRadius: "2px",
            animation: "progress-slide 1.5s ease-in-out infinite",
            width: "40%",
          }}
        />
      </div>
      <p style={{ color: "#8892a4", fontSize: "14px", margin: 0 }}>{label}</p>
      <style>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%) scaleX(1); }
          50% { transform: translateX(150%) scaleX(1.5); }
          100% { transform: translateX(300%) scaleX(1); }
        }
      `}</style>
    </div>
  );
}
