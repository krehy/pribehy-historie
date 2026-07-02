import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import StoryDetail from "@/pages/StoryDetail";
import About from "@/pages/About";
import Studio from "@/pages/Studio";
import Admin from "@/pages/Admin";
import AuthorProfile from "@/pages/AuthorProfile";
import BecomeAuthor from "@/pages/BecomeAuthor";
import { RequireRole } from "@/components/auth/RequireRole";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pribeh/:slug" element={<StoryDetail />} />
        <Route path="/o-projektu" element={<About />} />
        <Route path="/author/:slug" element={<AuthorProfile />} />
        <Route path="/become-author" element={<BecomeAuthor />} />
        <Route
          path="/studio"
          element={
            <RequireRole role={["author", "admin"]}>
              <Studio />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <Admin />
            </RequireRole>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
