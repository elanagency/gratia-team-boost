
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  Award, 
  Gift, 
  CreditCard, 
  Settings, 
  LogOut,
  Info,
  User,
  FileText,
  CheckSquare,
  Rocket,
  Folder,
  Eye,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminLayout = () => {
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      
      // Fetch company name
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (companyMember) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyMember.company_id)
          .single();
        
        if (company) {
          setCompanyName(company.name);
        }
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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
  const mainMenuItems = [
    { name: "Dashboard", icon: BarChart3, path: "/admin" },
    { name: "Team Management", icon: Users, path: "/admin/team" },
    { name: "Recognition History", icon: Award, path: "/admin/recognition" },
    { name: "Rewards Catalog", icon: Gift, path: "/admin/rewards" },
    { name: "Billing & Plan", icon: CreditCard, path: "/admin/billing" },
    { name: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  // Additional menu items (for demonstration, similar to the image)
  const additionalMenuItems = [
    { name: "Company Information", icon: Info, path: "/admin/company-info" },
    { name: "Personal Information", icon: User, path: "/admin/personal-info" },
    { name: "Credits", icon: CreditCard, path: "/admin/credits" },
    { name: "Verification", icon: CheckSquare, path: "/admin/verification" },
    { name: "Promotion", icon: Rocket, path: "/admin/promotion" },
    { name: "Portfolio", icon: Folder, path: "/admin/portfolio" },
    { name: "Visibility", icon: Eye, path: "/admin/visibility" },
    { name: "Statistics", icon: BarChart2, path: "/admin/statistics" },
    { name: "Documentation", icon: FileText, path: "/admin/documentation" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Header/Navbar */}
      <header className="border-b border-gray-200">
        <div className="max-w-1440 mx-auto px-5 flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
              alt="Grattia Logo" 
              className="h-10 w-auto" 
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {user?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-700 border-gray-300"
            >
              Log Out
              <LogOut className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 max-w-1440 w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-80 border-r border-gray-200 min-h-[calc(100vh-64px)]">
          <div className="p-4">
            <div className="font-medium text-lg mb-2">{companyName || "Your Company"}</div>
          </div>
          
          <nav className="px-2">
            <ul className="space-y-1">
              {mainMenuItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      isActive(item.path) 
                        ? "bg-[#F572FF] text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className={`mr-2 h-5 w-5 ${isActive(item.path) ? "text-white" : "text-gray-500"}`} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
