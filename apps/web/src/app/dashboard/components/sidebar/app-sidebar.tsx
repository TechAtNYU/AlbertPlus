"use client";

import type * as React from "react";
import { NavItems } from "@/app/dashboard/components/sidebar/nav-items";
import { NavUser } from "@/app/dashboard/components/sidebar/nav-user";
import { AlbertPlusLogo } from "@/components/Logo";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import config from "../../../../lib/config";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar: string;
    initial: string;
    isAdmin: boolean;
    userId?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! justify-center"
            >
              <AlbertPlusLogo
                variant={isCollapsed ? "icon" : "full"}
                href="/dashboard"
                width={isCollapsed ? 40 : 80}
                height={40}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavItems items={config.sidebar.navMain} />
        <div className="mt-auto">
          <NavItems items={config.sidebar.navBottom} />
        </div>
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
