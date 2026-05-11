'use client';

const menuItems = [
  { label: '一览', active: true },
  { label: '历史', active: false },
  { label: '人物', active: false },
  { label: '账户', active: false },
];

export default function BottomMenu() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-245 items-center justify-between gap-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition ${
              item.active
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {item.label[0]}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
