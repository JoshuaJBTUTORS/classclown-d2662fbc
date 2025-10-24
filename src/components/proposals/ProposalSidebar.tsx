import { FileText, DollarSign, Gift, Users, Trophy } from 'lucide-react';
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

interface ProposalSidebarProps {
  currentStep: 'view' | 'agreement' | 'payment';
  proposalStatus: string;
  onNavigate?: (section: string) => void;
}

const sections = [
  { id: 'investment', title: 'Investment', icon: DollarSign },
  { id: 'offering', title: 'Our Offering', icon: Gift },
  { id: 'tutors', title: 'Our Tutors', icon: Users },
  { id: 'track-record', title: 'Track Record', icon: Trophy },
];

export function ProposalSidebar({ currentStep, proposalStatus }: ProposalSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Sidebar variant="sidebar" className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Proposal Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className={isCollapsed ? 'px-2' : 'px-4 py-3'}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {!isCollapsed && (
                  <span className="text-sm font-medium capitalize">
                    {currentStep === 'view' ? proposalStatus : currentStep}
                  </span>
                )}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentStep === 'view' && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sections.map((section) => (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => scrollToSection(section.id)}
                      className="hover:bg-muted/50"
                    >
                      <section.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{section.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
