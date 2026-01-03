import { useState } from 'react';
import { 
  FileText, 
  Settings, 
  LayoutDashboard, 
  ChevronsUpDown,
  Database,
  UserCircle,
  Shield,
  BookOpen,
  Scale,
  Layers,
  Building2,
  ChevronDown,
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Role types for dev mode switching
type DevRole = 'buyer' | 'internal' | 'provider';

// Navigation structure organized by role
const buyerNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Requests', url: '/requests', icon: FileText },
  { title: 'Shortlists', url: '/shortlists', icon: Layers },
];

const internalNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Requests', url: '/requests', icon: FileText },
  { title: 'Providers', url: '/providers', icon: Database },
  { title: 'Scorecards', url: '/scorecards', icon: Scale },
  { title: 'Shortlists', url: '/shortlists', icon: Layers },
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
      >
        <NavLink to={item.url} className="text-sm">
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-sm bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background font-medium text-sm">S</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground">Sablecrest</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Workspace Selector */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors text-left border border-sidebar-border">
                <div className="min-w-0">
                  <p className="text-xs text-sidebar-foreground">Workspace</p>
                  <p className="text-sm font-medium text-sidebar-accent-foreground truncate mt-0.5">
                    {currentWorkspace?.name || (isUiShellMode ? 'Demo Workspace' : 'Select')}
                  </p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {workspaces.length > 0 ? (
                workspaces.map(workspace => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setCurrentWorkspace(workspace)}
                    className={cn(
                      "text-sm",
                      currentWorkspace?.id === workspace.id && 'bg-accent'
                    )}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {workspace.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-sm text-muted-foreground">
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
            <SidebarGroupLabel className="text-xs text-sidebar-foreground px-2 mb-1">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems().map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-sidebar-foreground px-2 mb-1">
              Account
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Dev Mode Role Switcher */}
        {isUiShellMode && !isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-warning/10 border border-warning/30 text-left">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-warning/80">Dev Mode</p>
                  <p className="text-xs font-medium text-foreground capitalize">{devRole}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-warning/80" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setDevRole('buyer')} className={cn(devRole === 'buyer' && 'bg-accent')}>
                <UserCircle className="h-4 w-4 mr-2" />
                Buyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDevRole('internal')} className={cn(devRole === 'internal' && 'bg-accent')}>
                <Shield className="h-4 w-4 mr-2" />
                Internal (Sablecrest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDevRole('provider')} className={cn(devRole === 'provider' && 'bg-accent')}>
                <Building2 className="h-4 w-4 mr-2" />
                Provider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
