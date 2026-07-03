import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { markAllStories } from "@/pages/Home";

/**
 * „Všechny příběhy" — není samostatná stránka: jen přepne Home do režimu „všechny země"
 * (osa/přehled nad mapou přes celý svět + výběr země) a přesměruje na „/".
 * Přehled tak žije TÝŽ jako z mapy, jen s filtrem země, když stát není vybraný.
 */
export default function AllStories() {
  const navigate = useNavigate();
  useEffect(() => {
    markAllStories();
    navigate("/", { replace: true });
  }, [navigate]);
  return null;
}
