const API_URL = import.meta.env.VITE_API_URL;
import { useState } from "react";
import axios from "axios";

export default function App() {
  const [form, setForm] = useState({
    bearing_type: "Deep Groove Ball Bearing",
    number_of_rows: 1,
    ball_diameter: 5,
    radial_load: 10000,
    axial_load: 30000,
    speed: 500,
    required_life: 10000,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/calculate-bearing`,
        form
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Calculation Failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/generate-pdf`,
        form,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = "Bearing_Report.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert("PDF Generation Failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <div className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold">
            Mechanical Design Portal
          </h1>

          <p className="text-slate-300 mt-2">
            Bearing Life Calculator
          </p>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT SIDE */}
          <div className="space-y-6">

            {/* Bearing Details */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-5">
                Bearing Details
              </h2>

              <div className="space-y-4">

                <div>
                  <label className="block mb-2 font-medium">
                    Type of Bearing
                  </label>

                  <select
                    className="w-full border rounded-lg p-3"
                    value={form.bearing_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bearing_type: e.target.value,
                      })
                    }
                  >
                    <option>
                      Deep Groove Ball Bearing
                    </option>

                    <option>
                      Spherical Roller Bearing
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Number of Rows
                  </label>

                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.number_of_rows}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        number_of_rows: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Ball Diameter (mm)
                  </label>

                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.ball_diameter}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ball_diameter: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Operating Conditions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-5">
                Operating Conditions
              </h2>

              <div className="space-y-4">

                <div>
                  <label className="block mb-2 font-medium">
                    Radial Load (N)
                  </label>

                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.radial_load}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        radial_load: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Axial Load (N)
                  </label>

                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.axial_load}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        axial_load: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Rotational Speed (RPM)
                  </label>

                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.speed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        speed: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Life Required (Hours)
                  </label>

                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.required_life}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        required_life: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">

              <button
                onClick={calculate}
                disabled={loading}
                className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-semibold hover:bg-slate-800"
              >
                {loading ? "Calculating..." : "Calculate"}
              </button>

              <button
                onClick={downloadPdf}
                className="flex-1 bg-green-600 text-white p-4 rounded-xl font-semibold hover:bg-green-700"
              >
                Download PDF
              </button>

            </div>

          </div>

          {/* RIGHT SIDE */}
          <div>

            <div className="bg-white rounded-xl shadow p-6">

              <h2 className="text-2xl font-semibold mb-6">
                Results
              </h2>

              {!result && (
                <div className="text-gray-500">
                  Perform a calculation to view results.
                </div>
              )}

              {result && (
                <div className="grid md:grid-cols-2 gap-4">

                  <ResultCard
                    title="Outer Diameter"
                    value={result.outer_diameter}
                    unit="mm"
                  />

                  <ResultCard
                    title="Inner Diameter"
                    value={result.inner_diameter}
                    unit="mm"
                  />

                  <ResultCard
                    title="Width"
                    value={result.width}
                    unit="mm"
                  />

                  <ResultCard
                    title="Number Of Balls"
                    value={result.number_of_balls}
                    unit=""
                  />

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function ResultCard({ title, value, unit }) {
  return (
    <div className="border rounded-xl p-6 bg-slate-50">

      <div className="text-sm text-gray-500 mb-2">
        {title}
      </div>

      <div className="text-3xl font-bold text-slate-900">
        {value}
      </div>

      <div className="text-gray-600 mt-1">
        {unit}
      </div>

    </div>
  );
}