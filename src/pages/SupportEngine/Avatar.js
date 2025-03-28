import React, { useState } from "react";

export const styles = {
  avatarHello: {
    position: "absolute",
    bottom: "70px",
    right: "10px",
    backgroundColor: "#0866FF",
    color: "white",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    whiteSpace: "nowrap", 
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
    transition: "opacity 0.3s ease",
  },
  chatWithMeButton: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    cursor: "pointer",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
    backgroundImage:
      "url('https://i.pinimg.com/736x/2f/ef/0f/2fef0f62560b377da3b4434bc6062a16.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
};

const Avatar = (props) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px" }}>
      {/* Message Bubble */}
      {hovered && (
        <div
          className="transition-3"
          style={{
            ...styles.avatarHello,
            opacity: hovered ? "1" : "0",
          }}
        >
          Hey, it's Sinchan!
        </div>
      )}

      {/* Chat Avatar */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => props.onClick && props.onClick()}
        className="transition-3"
        style={{
          ...styles.chatWithMeButton,
          border: hovered ? "2px solid #f0f8ff" : "4px solid #0866FF",
        }}
      />
    </div>
  );
};

export default Avatar;