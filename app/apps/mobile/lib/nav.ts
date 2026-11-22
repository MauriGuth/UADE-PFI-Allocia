import { createContext, useContext } from "react";
import type { NavIconName } from "../components/icons";

/** Navegación entre pestañas para componentes que no la reciben por props (p. ej. el avatar del título). */
export const NavContext = createContext<{ go: (tab: NavIconName) => void }>({ go: () => {} });
export const useNav = () => useContext(NavContext);
