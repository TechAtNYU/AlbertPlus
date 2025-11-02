"use client";

import Image from "next/image";
import type * as React from "react";
import { NavItems } from "@/app/dashboard/components/sidebar/nav-items";
import { NavUser } from "@/app/dashboard/components/sidebar/nav-user";
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
              className="data-[slot=sidebar-menu-button]:p-1.5! "
            >
              <a href="/dashboard" className="flex items-center justify-center">
                <Image
                  src={isCollapsed ? "/logo_small.svg" : "/logo.svg"}
                  alt="AlbertPlus Logo"
                  width={isCollapsed ? 30 : 80}
                  height={30}
                />
              </a>
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
