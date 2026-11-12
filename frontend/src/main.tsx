import { LanguageDocument } from "./i18n/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import AppRoutes from "./app/router/AppRoutes";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageDocument />
      <AppRoutes />
    </QueryClientProvider>
  </React.StrictMode>,
);
