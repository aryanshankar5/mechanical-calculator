import { useState } from "react";
import axios from "axios";

function App() {
  const [form, setForm] = useState({
    radial_load: 10000,
    axial_load: 30000,
    speed: 500,
    required_life: 10000
  });

  const [result, setResult] = useState(null);

  const calculate = async () => {
    const response = await axios.post(
      "http://127.0.0.1:8000/calculate-bearing",
      form
    );

    setResult(response.data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bearing Calculator</h1>

      <input
        type="number"
        placeholder="Radial Load"
        value={form.radial_load}
        onChange={(e) =>
          setForm({
            ...form,
            radial_load: Number(e.target.value)
          })
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="Axial Load"
        value={form.axial_load}
        onChange={(e) =>
          setForm({
            ...form,
            axial_load: Number(e.target.value)
          })
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="Speed"
        value={form.speed}
        onChange={(e) =>
          setForm({
            ...form,
            speed: Number(e.target.value)
          })
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="Required Life"
        value={form.required_life}
        onChange={(e) =>
          setForm({
            ...form,
            required_life: Number(e.target.value)
          })
        }
      />

      <br /><br />

      <button onClick={calculate}>
        Calculate
      </button>

      {result && (
        <div>
          <h2>Results</h2>

          <p>Equivalent Load: {result.equivalent_load}</p>

          <p>
            Required Dynamic Capacity:
            {result.required_dynamic_capacity}
          </p>

          <p>Outer Diameter: {result.outer_diameter}</p>

          <p>Inner Diameter: {result.inner_diameter}</p>

          <p>Width: {result.width}</p>

          <p>Number of Balls: {result.number_of_balls}</p>
        </div>
      )}
    </div>
  );
}

export default App;
