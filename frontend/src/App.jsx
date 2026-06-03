import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import BearingCalculator from "./pages/BearingCalculator";
import VibratingScreenCalculator from "./pages/VibratingScreenCalculator";

export default function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/bearing"
          element={<BearingCalculator />}
        />

        <Route
          path="/vibrating-screen"
          element={<VibratingScreenCalculator />}
        />

      </Routes>

    </BrowserRouter>
  );
}