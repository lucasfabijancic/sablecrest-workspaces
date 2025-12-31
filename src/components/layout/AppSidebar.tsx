import { FileText, Building2, Settings, LayoutDashboard, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'ops', 'client'] },
  { title: 'Requests', url: '/requests', icon: FileText, roles: ['admin', 'ops', 'client'] },
];

const manageNavItems = [
  { title: 'Providers', url: '/providers', icon: Building2, roles: ['admin', 'ops'] },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['admin'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { currentWorkspace, workspaces, setCurrentWorkspace, currentMembership, hasRole } = useAuth();
  const isCollapsed = state === 'collapsed';

  const visibleMainItems = mainNavItems.filter(item => 
    hasRole(item.roles as ('admin' | 'ops' | 'client')[])
  );

  const visibleManageItems = manageNavItems.filter(item => 
    hasRole(item.roles as ('admin' | 'ops' | 'client')[])
  );

  const isActive = (url: string) => {
    if (url === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        <div className={cn(
          "flex items-center gap-2",
          isCollapsed && "justify-center"
        )}>
          <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background font-bold text-xs">S</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">Sablecrest</p>
              <p className="text-[10px] text-sidebar-foreground truncate">Operations</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Workspace Selector */}
      {workspaces.length > 0 && !isCollapsed && (
        <div className="px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-left">
                <div className="min-w-0">
                  <p className="text-[10px] text-sidebar-foreground uppercase tracking-wider">Workspace</p>
                  <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                    {currentWorkspace?.name || 'Select'}
                  </p>
                </div>
                <ChevronsUpDown className="h-3 w-3 text-sidebar-foreground shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {workspaces.map(workspace => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setCurrentWorkspace(workspace)}
                  className={cn(
                    "text-xs",
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

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground px-2 py-1">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} className="text-xs">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Manage Navigation */}
        {visibleManageItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground px-2 py-1">
                Manage
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleManageItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url} className="text-xs">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!isCollapsed && (
          <div className="px-2 py-1.5 rounded-md bg-sidebar-accent/30">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground">Role</p>
            <p className="text-xs font-medium text-sidebar-accent-foreground capitalize">
              {currentMembership?.role || 'No role'}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}