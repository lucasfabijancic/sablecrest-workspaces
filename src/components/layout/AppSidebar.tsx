import { useState } from 'react';
import { 
  FileText, 
  Settings, 
  LayoutDashboard, 
  ChevronsUpDown,
  Database,
  Users,
  UserCircle,
  Shield,
  Scale,
  Layers,
  Building2,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
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

// Role types for dev mode switching
type DevRole = 'buyer' | 'internal' | 'provider';

// Navigation structure organized by role
const buyerNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Briefs', url: '/briefs', icon: FileText },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const internalNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/admin/clients', icon: Users },
  { title: 'Briefs', url: '/briefs', icon: FileText },
  { title: 'Providers', url: '/providers', icon: Database },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
];

const providerNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Opportunities', url: '/provider-portal/opportunities', icon: FileText },
  { title: 'Profile', url: '/provider-portal/profile', icon: UserCircle },
];

const settingsNav = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { currentWorkspace, workspaces, setCurrentWorkspace, isUiShellMode } = useAuth();
  const isCollapsed = state === 'collapsed';
  
  // Dev mode role switcher
  const [devRole, setDevRole] = useState<DevRole>('internal');

  const isActive = (url: string) => {
    if (url === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    if (url.startsWith('/admin/')) return location.pathname === url || location.pathname.startsWith(`${url}/`);
    if (url === '/shortlists') return location.pathname.startsWith('/shortlists');
    return location.pathname.startsWith(url);
  };

  // Get nav items based on role
  const getNavItems = () => {
    switch (devRole) {
      case 'buyer':
        return buyerNav;
      case 'provider':
        return providerNav;
      case 'internal':
      default:
        return internalNav;
    }
  };

  const renderNavItem = (item: { title: string; url: string; icon: typeof LayoutDashboard }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={item.title}
        className="h-9 transition-colors duration-150 hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-transparent active:text-sidebar-accent-foreground data-[active=true]:bg-transparent data-[active=true]:hover:bg-transparent data-[active=true]:active:bg-transparent"
      >
        <NavLink to={item.url} className="text-[12px]">
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar"
      style={{ '--sidebar-width': '240px', '--sidebar-width-icon': '56px' } as React.CSSProperties}
    >
      <SidebarHeader className="px-4 py-4">
        <div className={cn(
          "flex items-center gap-2.5",
          isCollapsed && "justify-center"
        )}>
          <div className="h-6 w-6 bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background font-semibold text-[10px]">S</span>
          </div>
          {!isCollapsed && (
            <span className="text-[13px] font-semibold text-sidebar-accent-foreground tracking-tight">
              Sablecrest
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-3" />

      {/* Workspace Selector */}
      {!isCollapsed && (
        <div className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 bg-sidebar-accent/40 hover:bg-sidebar-accent transition-colors text-left border border-sidebar-border">
                <div className="min-w-0">
                  <p className="text-[9px] text-sidebar-foreground uppercase tracking-wider">Workspace</p>
                  <p className="text-[12px] font-medium text-sidebar-accent-foreground truncate mt-0.5">
                    {currentWorkspace?.name || (isUiShellMode ? 'Demo Workspace' : 'Select')}
                  </p>
                </div>
                <ChevronsUpDown className="h-3 w-3 text-sidebar-foreground shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {workspaces.length > 0 ? (
                workspaces.map(workspace => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setCurrentWorkspace(workspace)}
                    className={cn(
                      "text-[12px]",
                      currentWorkspace?.id === workspace.id && 'bg-accent'
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5 mr-2" />
                    {workspace.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-[12px] text-muted-foreground">
                  No workspaces
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <SidebarContent className="px-3">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[9px] text-sidebar-foreground px-2 mb-1.5 uppercase tracking-wider">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {getNavItems().map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[9px] text-sidebar-foreground px-2 mb-1.5 uppercase tracking-wider">
              Account
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {settingsNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {/* Dev Mode Role Switcher */}
        {isUiShellMode && !isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 bg-warning/8 border border-warning/15 text-left">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-warning/60">Dev Mode</p>
                  <p className="text-[11px] font-medium text-foreground capitalize">{devRole}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-warning/60" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => setDevRole('buyer')} className={cn("text-[12px]", devRole === 'buyer' && 'bg-accent')}>
                <UserCircle className="h-3.5 w-3.5 mr-2" />
                Buyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDevRole('internal')} className={cn("text-[12px]", devRole === 'internal' && 'bg-accent')}>
                <Shield className="h-3.5 w-3.5 mr-2" />
                Internal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDevRole('provider')} className={cn("text-[12px]", devRole === 'provider' && 'bg-accent')}>
                <Building2 className="h-3.5 w-3.5 mr-2" />
                Provider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
