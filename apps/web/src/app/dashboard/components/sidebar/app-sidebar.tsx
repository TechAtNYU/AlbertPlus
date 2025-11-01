"use client";

import { ArrowUpCircleIcon } from "lucide-react";
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! "
            >
              <a href="/dashboard">
                <ArrowUpCircleIcon className="size-5!" />
                <span className="text-base font-semibold">Course Helper</span>
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
