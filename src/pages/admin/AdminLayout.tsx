import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Award, Gift, CreditCard, Settings, LogOut, Search, Bell, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const AdminLayout = () => {
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("Jane Doe");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);

      // Fetch company name
      const {
        data: companyMember
      } = await supabase.from('company_members').select('company_id').eq('user_id', session.user.id).single();
      if (companyMember) {
        const {
          data: company
        } = await supabase.from('companies').select('name').eq('id', companyMember.company_id).single();
        if (company) {
          setCompanyName(company.name);
        }
      }

      // Try to get user name if available
      const {
        data: profile
      } = await supabase.from('profiles').select('first_name, last_name').eq('id', session.user.id).single();
      if (profile && profile.first_name) {
        setUserName(`${profile.first_name} ${profile.last_name || ''}`);
      }
    };
    checkAuth();
    const {
      data: authListener
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Menu items for sidebar
  const menuItems = [{
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin"
  }, {
    name: "Team",
    icon: Users,
    path: "/admin/team"
  }, {
    name: "Recognition",
    icon: Award,
    path: "/admin/recognition"
  }, {
    name: "Rewards",
    icon: Gift,
    path: "/admin/rewards"
  }, {
    name: "Billing",
    icon: CreditCard,
    path: "/admin/billing"
  }, {
    name: "Settings",
    icon: Settings,
    path: "/admin/settings"
  }];
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  return <div className="flex h-screen bg-[#f7f8fa]">
      {/* Left Sidebar */}
      <div className="w-[280px] flex-shrink-0 dark-sidebar px-0">
        <div className="flex items-center p-4 border-b border-white/10">
          <Link to="/admin" className="flex items-center">
            <img src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" alt="Grattia Logo" className="h-8 w-auto mr-2" />
            
          </Link>
        </div>
        
        <nav className="py-4">
          {menuItems.map(item => <Link key={item.name} to={item.path} className={`dark-sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}>
              <item.icon className={`dark-sidebar-nav-item-icon ${isActive(item.path) ? 'text-[#F572FF]' : 'text-white'}`} />
              <span>{item.name}</span>
            </Link>)}
        </nav>

        <div className="absolute bottom-0 left-0 w-[225px] border-t border-white/10 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#F572FF] rounded-full flex items-center justify-center text-white font-medium">
              {userName.charAt(0)}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-white/70 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="ml-2 text-white/70 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className=" h-16 flex items-center px-6 bg-transparent">
          <div className="flex-1">
            <h1 className="text-xl font-medium text-gray-800">
              Hello, {userName} 👋
            </h1>
            <p className="text-sm text-gray-500">Here's what's going on today.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Search size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <HelpCircle size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Bell size={20} />
            </Button>
          </div>
        </header>
        
        {/* Content Area with Scrolling */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>;
};
export default AdminLayout;