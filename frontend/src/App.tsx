
import { useState } from "react";
import BooksPage from "./pages/BooksPage";
import LoansPage from "./pages/LoansPage";

function App() {
  const [currentPage, setCurrentPage] = useState<"books" | "loans">("books");

  if (currentPage === "loans") {
    return <LoansPage onNavigate={setCurrentPage} />;
  }

  return <BooksPage onNavigate={setCurrentPage} />;
}

export default App;
