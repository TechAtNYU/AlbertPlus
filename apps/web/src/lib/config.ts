import {
  Calendar,
  ClipboardList,
  Home,
  MapIcon,
  Send,
  Settings,
} from "lucide-react";

const config = {
  sidebar: {
    navMain: [
      { title: "Home", url: "/dashboard", icon: Home },
      { title: "Schedule", url: "/dashboard/schedule", icon: Calendar },
      { title: "Register", url: "/dashboard/register", icon: ClipboardList },
      { title: "Plan", url: "/dashboard/plan", icon: MapIcon },
    ],
    navBottom: [
      { title: "Settings", url: "#settings", icon: Settings },
      { title: "Feedback", url: "/feedback", icon: Send },
    ],
  },
};

export default config;
