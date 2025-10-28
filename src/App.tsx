import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FacultyProfile from "./pages/FacultyProfile";
import AddFaculty from "./pages/AddFaculty";
import Profile from "./pages/Profile";
import Browse from "./pages/Browse";
import Admin from "./pages/Admin";
import SearchFaculty from "./pages/SearchFaculty";
import EditFaculty from "./pages/EditFaculty";
import BlacklistedFaculty from "./pages/BlacklistedFaculty";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/faculty/:id" element={<FacultyProfile />} />
          <Route path="/edit-faculty/:id" element={<EditFaculty />} />
          <Route path="/add-faculty" element={<AddFaculty />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/search" element={<SearchFaculty />} />
          <Route path="/blacklisted" element={<BlacklistedFaculty />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;