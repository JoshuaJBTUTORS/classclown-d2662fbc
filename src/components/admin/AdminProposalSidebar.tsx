import { FileText, BarChart3, Filter, Settings, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface AdminProposalSidebarProps {
  totalProposals: number;
  filteredCount: number;
  onFilterChange?: (filter: string) => void;
}

const statusItems = [
  { id: 'all', title: 'All Proposals', icon: FileText },
  { id: 'sent', title: 'Sent', icon: FileText },
  { id: 'viewed', title: 'Viewed', icon: FileText },
  { id: 'agreed', title: 'Agreed', icon: FileText },
  { id: 'completed', title: 'Completed', icon: FileText },
];

export function AdminProposalSidebar({ totalProposals, filteredCount }: AdminProposalSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar variant="sidebar" className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>
            {!isCollapsed && 'Statistics'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className={isCollapsed ? 'px-2 py-3' : 'px-4 py-3 space-y-3'}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pastel-lilac text-foreground"><BarChart3 className="h-4 w-4" /></span>
                {!isCollapsed && (
                  <div>
                    <p className="font-heading text-2xl font-extrabold text-foreground">{totalProposals}</p>
                    <p className="text-xs text-muted-foreground">Total Proposals</p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pastel-mint text-foreground"><Filter className="h-4 w-4" /></span>
                  <div>
                    <p className="text-lg font-semibold">{filteredCount}</p>
                    <p className="text-xs text-muted-foreground">Filtered Results</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            {!isCollapsed && 'Quick Filters'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {statusItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton className="rounded-full font-medium hover:bg-pastel-sky/70">
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            {!isCollapsed && 'Quick Links'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="rounded-full font-medium hover:bg-pastel-sky/70"
                  onClick={() => navigate('/admin/proposals/signed')}
                >
                  <FileCheck className="h-4 w-4" />
                  {!isCollapsed && <span>Signed Proposals</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="rounded-full font-medium hover:bg-pastel-sky/70">
                  <Settings className="h-4 w-4" />
                  {!isCollapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
