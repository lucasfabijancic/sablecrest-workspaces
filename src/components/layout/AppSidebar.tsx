import { 
  FileText, 
  Building2, 
  Settings, 
  LayoutDashboard, 
  ChevronsUpDown,
  ClipboardList,
  Package,
  Database,
  UserCircle,
  Shield,
  BookOpen,
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

// Navigation structure organized by role groups
const buyerNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Requests', url: '/requests', icon: FileText },
];

const opsNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Requests', url: '/requests', icon: FileText },
  { title: 'Selection Packs', url: '/selection-packs', icon: Package },
];

const opsRegistryNav = [
  { title: 'Provider Registry', url: '/providers', icon: Database },
];

const providerNav = [
  { title: 'Profile', url: '/provider-portal/profile', icon: UserCircle },
  { title: 'Evidence', url: '/provider-portal/evidence', icon: Shield },
  { title: 'References', url: '/provider-portal/references', icon: BookOpen },
];

const settingsNav = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { currentWorkspace, workspaces, setCurrentWorkspace, currentMembership, hasRole, isUiShellMode } = useAuth();
  const isCollapsed = state === 'collapsed';

  // In UI shell mode, show all navigation for development
  const showBuyer = isUiShellMode || hasRole(['client', 'admin', 'ops']);
  const showOps = isUiShellMode || hasRole(['admin', 'ops']);
  const showProvider = isUiShellMode || hasRole(['admin']); // Provider portal visible to admins for now
  const showSettings = true; // Always show settings

  const isActive = (url: string) => {
    if (url === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(url);
  };

  const renderNavGroup = (
    label: string, 
    items: { title: string; url: string; icon: typeof LayoutDashboard }[],
    show: boolean
  ) => {
    if (!show || items.length === 0) return null;
    
    return (
      <SidebarGroup>
        {!isCollapsed && (
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground px-2 py-1">
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
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
    );
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
        {/* Buyer Navigation */}
        {renderNavGroup('Buyer', buyerNav, showBuyer)}

        {/* Ops Navigation */}
        {renderNavGroup('Ops Console', opsNav.filter(item => 
          item.title !== 'Dashboard' && item.title !== 'Requests'
        ), showOps)}
        
        {renderNavGroup('Registry', opsRegistryNav, showOps)}

        {/* Provider Portal Navigation */}
        {renderNavGroup('Provider Portal', providerNav, showProvider)}

        {/* Settings */}
        {renderNavGroup('', settingsNav, showSettings)}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!isCollapsed && (
          <div className="px-2 py-1.5 rounded-md bg-sidebar-accent/30">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground">Role</p>
            <p className="text-xs font-medium text-sidebar-accent-foreground capitalize">
              {isUiShellMode ? 'Admin (Demo)' : currentMembership?.role || 'No role'}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
