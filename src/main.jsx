import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

const rootElement = document.getElementById("root")

if (!rootElement) {
  console.error('Root element not found. Make sure there is a div with id="root" in your HTML.')
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
