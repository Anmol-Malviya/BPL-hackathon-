"use client";

export default function BottomNav({ activeTab, setActiveTab, navItems }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-16 bg-white border-t border-slate-200 flex items-center gap-1 px-4 overflow-x-auto no-scrollbar pb-safe-bottom">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1.5 min-w-[76px] py-1 text-center transition-colors flex-shrink-0 ${
              isActive ? "text-primary font-bold" : "text-text-secondary hover:text-navy"
            }`}
          >
            <span className="h-5 w-5 flex items-center justify-center shrink-0">
              {item.icon}
            </span>
            <span className="text-[9px] tracking-wide font-medium leading-none">
              {item.label.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
