"use client";

export default function BottomNav({ activeTab, setActiveTab, navItems }) {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`bottom-nav-btn ${activeTab === item.id ? "active" : ""}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          {item.label.split(" ")[0]}
        </button>
      ))}
    </nav>
  );
}
