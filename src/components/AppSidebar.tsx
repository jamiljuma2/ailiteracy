import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Video, Settings2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  variant: "user" | "admin";
  children: ReactNode;
  onSignOut?: () => void;
};

function isActivePath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppSidebar({ variant, children, onSignOut }: AppSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const items =
    variant === "admin"
      ? [
          { label: "Admin Dashboard", to: "/admin", icon: LayoutDashboard },
          { label: "Manage Sessions", to: "/admin/sessions", icon: Settings2 },
          { label: "Public Sessions", to: "/sessions", icon: Video },
        ]
      : [
          { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
          { label: "Sessions", to: "/sessions", icon: Video },
          { label: "Admin Login", to: "/admin/login", icon: Settings2 },
        ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-3">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/60">
              AI Skills Africa
            </div>
            <div className="mt-1 text-lg font-semibold text-sidebar-foreground">
              {variant === "admin" ? "Admin Console" : "Student Portal"}
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = isActivePath(pathname, item.to);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} className="w-full justify-start">
                        <Link to={item.to}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {onSignOut ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          ) : null}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 md:hidden">
          <SidebarTrigger />
          <div className="text-sm font-medium text-foreground">
            {variant === "admin" ? "Admin Console" : "Student Portal"}
          </div>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
