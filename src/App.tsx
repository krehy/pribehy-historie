import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import History from "@/pages/History";
import AllStories from "@/pages/AllStories";
import StoryDetail from "@/pages/StoryDetail";
import CharacterProfile from "@/pages/CharacterProfile";
import About from "@/pages/About";
import Studio from "@/pages/Studio";
import StudioNew from "@/pages/StudioNew";
import StudioEditor from "@/pages/StudioEditor";
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
        <Route path="/historie" element={<History />} />
        <Route path="/pribehy" element={<AllStories />} />
        <Route path="/pribeh/:slug" element={<StoryDetail />} />
        <Route path="/postava/:slug" element={<CharacterProfile />} />
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
          path="/studio/new"
          element={
            <RequireRole role={["author", "admin"]}>
              <StudioNew />
            </RequireRole>
          }
        />
        <Route
          path="/studio/editor/:id"
          element={
            <RequireRole role={["author", "admin"]}>
              <StudioEditor />
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
