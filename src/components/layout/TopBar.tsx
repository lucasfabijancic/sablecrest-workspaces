import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Command, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/requests': 'Requests',
  '/briefs': 'Briefs',
  '/providers': 'Providers',
  '/scorecards': 'Scorecards',
  '/shortlists': 'Shortlists',
  '/messages': 'Messages',
  '/settings': 'Settings',
};

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isUiShellMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const userEmail = isUiShellMode ? 'demo@sablecrest.io' : user?.email;
  
  // Get current page title
  const currentPath = location.pathname;
  const pageTitle = routeTitles[currentPath] || 
    (currentPath.startsWith('/briefs/') ? 'Brief' :
    currentPath.startsWith('/requests/') ? 'Request' : 
    currentPath.startsWith('/shortlists/') ? 'Shortlist' : 'Sablecrest');

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-7 w-7" />
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">{pageTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-48 justify-start text-[11px] text-muted-foreground border-border"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-3 w-3 mr-2" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-0.5 border border-border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
              <Command className="h-2 w-2" />K
            </kbd>
          </Button>

          {/* New Brief button */}
          <Button
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => navigate('/briefs/new')}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Brief
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-[12px] font-medium text-foreground truncate">{userEmail}</p>
                {isUiShellMode && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">UI Shell Mode</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-[12px]">
                <Settings className="h-3.5 w-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-[12px] text-destructive" disabled={isUiShellMode}>
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette Dialog */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="border-b border-border">
            <div className="flex items-center px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search briefs, providers..."
                className="border-0 focus-visible:ring-0 text-[12px] h-10"
                autoFocus
              />
            </div>
          </div>
          <div className="p-2 max-h-[280px] overflow-auto">
            <div className="text-[9px] text-muted-foreground px-2 py-1.5 font-medium uppercase tracking-wider">Quick Actions</div>
            <button
              className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setCommandOpen(false);
                navigate('/briefs/new');
              }}
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              Create new brief
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setCommandOpen(false);
                navigate('/briefs');
              }}
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              View all briefs
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setCommandOpen(false);
                navigate('/providers');
              }}
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              View providers
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
