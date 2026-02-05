import { useState } from 'react';
import { useNavigation, Page } from './stores/navigationStore';
import Navbar from './components/navigation/Navbar';
import { Dashboard } from './pages/Dashboard';
import { FilesPage } from './pages/Files';
import { CodePage } from './pages/Code';
import { TerminalPage } from './pages/Terminal';
import { SettingsPage } from './pages/Settings';

function App() {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string>('default');
  const { currentPage, setPage } = useNavigation();

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    setPage('files');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onSelectProject={handleSelectProject} />;
      case 'files':
        return (
          <FilesPage
            activeFile={activeFile}
            onFileSelect={(file) => {
              setActiveFile(file);
              setPage('code');
            }}
          />
        );
      case 'code':
        return <CodePage activeFile={activeFile} />;
      case 'terminal':
        return <TerminalPage projectId={activeProject} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onSelectProject={handleSelectProject} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {renderPage()}
      </div>
      <Navbar
        onNavigate={(page) => setPage(page as Page)}
        onAction={(action) => {
          console.log('Action:', action);
          // TODO: Implement actions like run, preview, deploy, etc.
        }}
      />
    </div>
  );
}

export default App;
