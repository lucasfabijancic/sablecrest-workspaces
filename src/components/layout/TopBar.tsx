import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function TopBar() {
  const navigate = useNavigate();
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

  const displayName = isUiShellMode ? 'Demo Workspace' : currentWorkspace?.name;
  const userEmail = isUiShellMode ? 'demo@sablecrest.io' : user?.email;

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8" />
          {displayName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-border">/</span>
              <span className="font-medium text-foreground">{displayName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Command palette trigger */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-52 justify-start text-sm text-muted-foreground"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-sm border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>

          {/* New Request button */}
          <Button
            size="sm"
            className="h-8"
            onClick={() => navigate('/requests/new')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
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
              <div className="px-3 py-2">
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
            <div className="flex items-center px-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests, providers..."
                className="border-0 focus-visible:ring-0 text-sm h-11"
                autoFocus
              />
            </div>
          </div>
          <div className="p-2 max-h-[300px] overflow-auto">
            <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium">Quick Actions</div>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded"
              onClick={() => {
                setCommandOpen(false);
                navigate('/requests/new');
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create new request
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded"
              onClick={() => {
                setCommandOpen(false);
                navigate('/requests');
              }}
            >
              <Search className="h-3.5 w-3.5" />
              View all requests
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded"
              onClick={() => {
                setCommandOpen(false);
                navigate('/providers');
              }}
            >
              <Search className="h-3.5 w-3.5" />
              View providers
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
