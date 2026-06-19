import Navbar from "./components/navbar/navbar.jsx";
import { Outlet } from "react-router-dom";
import Footer from "./components/footer/footer.jsx";
import { CartProvider } from "./contexts/useCartContext";

function App() {
  return (
    <>
      <CartProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </CartProvider>
    </>
  );
}

export default App;
