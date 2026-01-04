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
  '/providers': 'Provider Registry',
  '/scorecards': 'Scorecards',
  '/shortlists': 'Shortlists',
  '/messages': 'Messages',
  '/settings': 'Settings',
};

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, currentWorkspace, isUiShellMode } = useAuth();
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
    (currentPath.startsWith('/requests/') ? 'Request' : 
    currentPath.startsWith('/shortlists/') ? 'Shortlist' : 'Sablecrest');

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 shrink-0">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">{pageTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-56 justify-start text-sm text-muted-foreground border-border"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-3.5 w-3.5 mr-2" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </Button>

          {/* New Request button */}
          <Button
            size="sm"
            className="h-8"
            onClick={() => navigate('/requests/new')}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Request
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
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                {isUiShellMode && (
                  <p className="text-xs text-muted-foreground mt-0.5">UI Shell Mode</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-sm text-destructive" disabled={isUiShellMode}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette Dialog */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="border-b border-border">
            <div className="flex items-center px-4">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests, providers..."
                className="border-0 focus-visible:ring-0 text-sm h-12"
                autoFocus
              />
            </div>
          </div>
          <div className="p-3 max-h-[320px] overflow-auto">
            <div className="text-[10px] text-muted-foreground px-2 py-2 font-medium uppercase tracking-wider">Quick Actions</div>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setCommandOpen(false);
                navigate('/requests/new');
              }}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              Create new request
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setCommandOpen(false);
                navigate('/requests');
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              View all requests
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setCommandOpen(false);
                navigate('/providers');
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              View providers
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
