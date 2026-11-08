import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./design-system/tokens.css";
import "./index.css";
import "./design-system/components/button.css";
import "./design-system/components/primitives.css";
import "./design-system/components/filter-interactions.css";
import "./design-system/components/application.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
