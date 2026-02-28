import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.documentElement;
const storedTheme = localStorage.getItem("bb-rsi-theme");
if (storedTheme === "dark") {
  root.classList.add("dark");
  root.style.colorScheme = "dark";
} else {
  root.classList.remove("dark");
  root.style.colorScheme = "light";
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
