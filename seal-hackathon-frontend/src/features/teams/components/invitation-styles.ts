import type React from "react";

export const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "linear-gradient(90deg, #06110f 0%, #06110f 100%), linear-gradient(90deg, #fff 0%, #fff 100%)",
};

export const blurStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backdropFilter: "blur(2px)",
  backgroundColor: "rgba(252, 248, 250, 0.6)",
};

export const modalStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #c6c6cd",
  borderRadius: 12,
  maxWidth: 480,
  width: "100%",
  boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
};

export const headerIconStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  backgroundColor: "#dae2fd",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.05)",
};

export const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  color: "#1b1b1d",
  letterSpacing: "-0.8px",
  lineHeight: "38.4px",
  textAlign: "center",
  margin: 0,
};

export const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: "#45464d",
  lineHeight: "21px",
  textAlign: "center",
};

export const warningStyle: React.CSSProperties = {
  backgroundColor: "rgba(245, 158, 11, 0.1)",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "0 4px 4px 0",
  padding: "8px 8px 8px 12px",
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
};

export const acceptBtnStyle: React.CSSProperties = {
  backgroundColor: "#10b981",
  color: "#ffffff",
  height: 48,
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "21px",
  cursor: "pointer",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.05)",
};

export const declineBtnStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#ba1a1a",
  height: 48,
  borderRadius: 8,
  border: "1px solid #ba1a1a",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "21px",
  cursor: "pointer",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
};

export const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#45464d",
  letterSpacing: "0.6px",
  lineHeight: "12px",
  textTransform: "uppercase",
};

export const metaTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#45464d",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};

export const trackBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  backgroundColor: "#dedfeb",
  borderRadius: 4,
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 500,
  color: "#60626c",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};
