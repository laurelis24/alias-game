import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <div className="min-h-screen bg-slate-200/80 flex flex-col items-center justify-center p-0 sm:p-4 alias-app-font select-none">
            <div className="relative w-full sm:max-w-[420px] h-screen sm:h-[812px] bg-white sm:rounded-[36px] sm:border-[8px] sm:border-slate-900 shadow-2xl overflow-hidden flex flex-col">
                <App />
            </div>
        </div>
    </StrictMode>,
);
