import { Home, Folder, FileCode, Terminal, Settings } from 'lucide-react';
import { useNavigation, type Page } from '../../stores/navigationStore';

const navItems: { page: Page; icon: typeof Home; label: string }[] = [
  { page: 'dashboard', icon: Home, label: 'Home' },
  { page: 'files', icon: Folder, label: 'Files' },
  { page: 'code', icon: FileCode, label: 'Code' },
  { page: 'terminal', icon: Terminal, label: 'Term' },
  { page: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { currentPage, setPage } = useNavigation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              currentPage === page
                ? 'text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
