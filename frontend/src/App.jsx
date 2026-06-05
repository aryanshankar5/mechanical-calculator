import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import BearingCalculator from "./pages/BearingCalculator";
import VibratingScreenCalculator from "./pages/VibratingScreenCalculator";
import VibratingFeederCalculator from "./pages/VibratingFeederCalculator";
import ConveyorCalculator from "./pages/ConveyorCalculator";


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

        <Route
          path="/vibrating-feeder"
          element={<VibratingFeederCalculator />}
        />
        
        <Route
          path="/conveyor"
          element={<ConveyorCalculator />}
        />
        
      </Routes>

    </BrowserRouter>
  );
}