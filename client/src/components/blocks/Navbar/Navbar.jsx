import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/ModeToggle";
import { NAV_LINKS } from "@/config/nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, LayoutDashboard, User } from "lucide-react";
import { NavigationSheet } from "./navigation-sheet";

export default function Navbar() {
  const navRef = useRef(null);
  const { pathname } = useLocation();
  const [activePath, setActivePath] = useState(pathname);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  useEffect(() => {
    const nav = navRef.current;
    const maxScroll = 1000;
    let rafId = null;
    const updateNav = () => {
      if (!nav) return;
      if (window.scrollY > 0) {
        nav.classList.add("scrolling");
        const scrollProgress = Math.min(window.scrollY / maxScroll, 1);
        const easeProgress = 1 - Math.pow(1 - scrollProgress, 4);
        const minWidth = 700;
        const maxWidth = window.innerWidth * 0.9;
        const currentWidth = maxWidth - (maxWidth - minWidth) * easeProgress;
        if (window.innerWidth >= 768) {
          nav.style.width = `${currentWidth}px`;
        }
      } else {
        nav.classList.remove("scrolling");
        nav.style.width = "90%";
      }
      rafId = null;
    };
    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateNav);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case "student":
        return "/dashboard-student";
      case "client":
        return "/dashboard-business";
      default:
        return "/";
    }
  };

  return (
    <div className="flex justify-center w-full">
      <nav
        ref={navRef}
        id="main-nav"
        className="fixed left-1/2 -translate-x-1/2 z-[100] bg-background border border-border backdrop-blur-xl transition-all duration-500 ease-in-out
  top-4 w-[90%] rounded-full"
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Logo className="w-8 h-8 text-primary" />
            </Link>
          </div>
          <ul className="hidden md:flex gap-8">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`transition-colors ${
                    activePath === item.href
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-muted-foreground/20">
                    <AvatarImage src={user.avatar} alt={user.fullname} />
                    <AvatarFallback>{user.fullname?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[9999] w-48 rounded-xl shadow-md border bg-background"
                >
                  <DropdownMenuItem onClick={() => navigate(getDashboardPath())} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(`/user-profile/${user._id}`)}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button onClick={() => navigate("/signup")}>Get Started</Button>
              </>
            )}
            <ModeToggle className="hidden md:inline-flex" />
            <div className="md:hidden">
              <NavigationSheet />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
