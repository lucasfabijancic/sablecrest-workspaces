import { FileText, Users, Settings, Building2, ChevronDown, LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Requests', url: '/requests', icon: FileText, roles: ['admin', 'ops', 'client'] },
  { title: 'Providers', url: '/providers', icon: Building2, roles: ['admin', 'ops'] },
  { title: 'Admin', url: '/admin', icon: Settings, roles: ['admin'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { currentWorkspace, workspaces, setCurrentWorkspace, currentMembership, hasRole, signOut, user } = useAuth();

  const visibleItems = navItems.filter(item => 
    hasRole(item.roles as ('admin' | 'ops' | 'client')[])
  );

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-accent-foreground text-sm">Sablecrest Ops</h1>
            <p className="text-xs text-sidebar-foreground">Operations Console</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Workspace Selector */}
        {workspaces.length > 0 && (
          <div className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors">
                  <div className="text-left">
                    <p className="text-xs text-sidebar-foreground">Workspace</p>
                    <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                      {currentWorkspace?.name || 'Select workspace'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {workspaces.map(workspace => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setCurrentWorkspace(workspace)}
                    className={cn(
                      currentWorkspace?.id === workspace.id && 'bg-accent'
                    )}
                  >
                    {workspace.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentMembership?.role || 'No role'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
