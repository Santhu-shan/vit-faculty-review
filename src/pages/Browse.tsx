import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FacultyCard from "@/components/FacultyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

const Browse = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchFaculty();
    }
  }, [user]);

  useEffect(() => {
    filterFaculty();
  }, [searchQuery, departmentFilter, faculty]);

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("approved", true)
        .order("name");

      if (error) throw error;
      
      setFaculty(data || []);
      
      // Extract unique departments
      const uniqueDepts = Array.from(new Set(data?.map(f => f.department) || []));
      setDepartments(uniqueDepts);
    } catch (error: any) {
      toast.error("Failed to load faculty");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterFaculty = () => {
    let filtered = [...faculty];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          (f.name || '').toLowerCase().includes(query) ||
          (f.faculty_id || '').toLowerCase().includes(query) ||
          (f.department || '').toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((f) => f.department === departmentFilter);
    }

    setFilteredFaculty(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Important Notice */}
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground">
            ⚠️ <strong>Important:</strong> This site is designed to help students make informed decisions. 
            Please refrain from posting false reviews or engaging in any inappropriate activities. 
            We appreciate all contributors who help by adding faculty information and providing honest reviews. 
            Thank you for building a trustworthy community! 🙏
          </p>
        </div>

        <h1 className="text-4xl font-bold mb-8">Browse Faculty</h1>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredFaculty.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-6">
              Showing {filteredFaculty.length} {filteredFaculty.length === 1 ? 'result' : 'results'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFaculty.map((f) => (
                <FacultyCard key={f.id} faculty={f} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground mb-4">No faculty found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
