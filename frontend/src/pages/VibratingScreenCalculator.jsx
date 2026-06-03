import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const moistureOptions = [
  "Dry",
  "Slightly damp",
  "Wet",
  "Sticky wet",
];

const particleShapeOptions = [
  "Rounded",
  "Cubical",
  "Angular",
  "Flat/elongated",
];

const screenTypeOptions = [
  "Linear",
  "Circular",
  "Elliptical",
];

const deckOptions = [1, 2, 3];

export default function VibratingScreenCalculator() {
  const navigate = useNavigate();

  

  const [form, setForm] = useState({
    feed_capacity: 190,
    material: "",
    feed_size: 13,
    aperture_size: 15,
    inclination: 7,
    moisture_condition: "Slightly damp",
    particle_shape: "Rounded",
    screen_type: "Linear",
    number_of_decks: 3,
    stroke: 8,
    motor_speed: 950,
    weight_oscillating_part: 202,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [materials, setMaterials] = useState([]);

        useEffect(() => {
        axios
            .get(`${API_URL}/vibrating-screen-materials`)
            .then((response) => {

                console.log("FULL RESPONSE:", response);

                const list = response.data.materials || [];

                console.log("MATERIAL LIST:", list);

                console.log("TOTAL MATERIALS:", list.length);

                setMaterials(list);

                if (list.length > 0) {

                    console.log("FIRST MATERIAL:", list[0]);

                    setForm((prev) => ({
                    ...prev,
                    material: list[0],
                    }));
                }
                })

            .catch((error) => {
            console.error("Failed to load materials", error);
            });
        }, []);

        
    const calculate = async () => {

    if (!form.material) {
        alert("Please select a material first");
        return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/calculate-vibrating-screen`,
        form
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Vibrating screen calculation failed");
    } finally {
      setLoading(false);
    }
  };

    const downloadPdf = async () => {

    if (!form.material) {
        alert("Please select a material first");
        return;
    }

    try {

    const response = await axios.post(
      `${API_URL}/generate-vibrating-screen-pdf`,
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

    link.download = "Vibrating_Screen_Report.pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();

  } catch (error) {

    console.error(error);

    alert("PDF Generation Failed");
  }
};

<button
  onClick={downloadPdf}
  className="w-full bg-green-600 text-white p-4 rounded-xl font-semibold hover:bg-green-700"
>
  Download PDF
</button>


  return (
    <div className="min-h-screen bg-slate-100">

      <div className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">
              Vibrating Screen Calculator
            </h1>

            <p className="text-slate-300 mt-2">
              Mechanical Design Portal
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="bg-white text-slate-900 px-5 py-2 rounded-lg font-semibold"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-2 gap-8">

          <div className="space-y-6">

            <Section title="Feed & Material Data">
              <Input
                label="Feed Capacity"
                value={form.feed_capacity}
                onChange={(value) =>
                  setForm({ ...form, feed_capacity: value })
                }
                unit="TPH"
              />

              <div>
                <label className="block mb-2 font-medium">
                  Material
                </label>

                <select
                  className="w-full border rounded-lg p-3"
                  value={form.material}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      material: e.target.value,
                    })
                  }
                >
                    <option value="">
                    Select Material
                    </option>

                    {materials.map((material, index) => (
                    <option key={`${material}-${index}`} value={material}>
                        {material}
                    </option>
                    ))}
                </select>
              </div>

              <Input
                label="Feed Size"
                value={form.feed_size}
                onChange={(value) =>
                  setForm({ ...form, feed_size: value })
                }
                unit="mm"
              />

              <Input
                label="Aperture Size"
                value={form.aperture_size}
                onChange={(value) =>
                  setForm({ ...form, aperture_size: value })
                }
                unit="mm"
              />
            </Section>

            <Section title="Correction Factors">
              <Input
                label="Inclination"
                value={form.inclination}
                onChange={(value) =>
                  setForm({ ...form, inclination: value })
                }
                unit="degree"
              />

              <Select
                label="Moisture Condition"
                value={form.moisture_condition}
                options={moistureOptions}
                onChange={(value) =>
                  setForm({ ...form, moisture_condition: value })
                }
              />

              <Select
                label="Particle Shape"
                value={form.particle_shape}
                options={particleShapeOptions}
                onChange={(value) =>
                  setForm({ ...form, particle_shape: value })
                }
              />
            </Section>

            <Section title="Screen & Drive Data">
              <Select
                label="Screen Type"
                value={form.screen_type}
                options={screenTypeOptions}
                onChange={(value) =>
                  setForm({ ...form, screen_type: value })
                }
              />

              <Select
                label="Number of Decks"
                value={form.number_of_decks}
                options={deckOptions}
                onChange={(value) =>
                  setForm({
                    ...form,
                    number_of_decks: Number(value),
                  })
                }
              />

              <Input
                label="Stroke"
                value={form.stroke}
                onChange={(value) =>
                  setForm({ ...form, stroke: value })
                }
                unit="mm"
              />

              <Input
                label="Motor Speed"
                value={form.motor_speed}
                onChange={(value) =>
                  setForm({ ...form, motor_speed: value })
                }
                unit="rpm"
              />

              <Input
                label="Weight of Oscillating Part"
                value={form.weight_oscillating_part}
                onChange={(value) =>
                  setForm({
                    ...form,
                    weight_oscillating_part: value,
                  })
                }
                unit="kg"
              />
            </Section>

            <button
              onClick={calculate}
              disabled={loading}
              className="w-full bg-slate-900 text-white p-4 rounded-xl font-semibold hover:bg-slate-800"
            >
              {loading ? "Calculating..." : "Calculate Vibrating Screen"}
            </button>

                <button
                    onClick={downloadPdf}
                    className="w-full bg-green-600 text-white p-4 rounded-xl font-semibold hover:bg-green-700"
                    >
                    Download PDF
                </button>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-2xl font-semibold mb-6">
                Results
              </h2>

              {!result && (
                <p className="text-gray-500">
                  Perform a calculation to view results.
                </p>
              )}

              {result && (
                <div className="grid md:grid-cols-2 gap-4">
                  <ResultCard
                    title="Required Screen Area"
                    value={result.required_screen_area}
                    unit="m²"
                  />

                  <ResultCard
                    title="Width"
                    value={result.width}
                    unit="m"
                  />

                  <ResultCard
                    title="Length"
                    value={result.length}
                    unit="m"
                  />

                  <ResultCard
                    title="Power"
                    value={result.power}
                    unit="kW"
                  />

                  <ResultCard
                    title="Screen Efficiency"
                    value={result.screen_efficiency}
                    unit="%"
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

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-5">
        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, unit }) {
  return (
    <div>
      <label className="block mb-2 font-medium">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="number"
          className="w-full border rounded-lg p-3"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        {unit && (
          <div className="w-20 bg-slate-100 border rounded-lg flex items-center justify-center text-sm">
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block mb-2 font-medium">
        {label}
      </label>

      <select
        className="w-full border rounded-lg p-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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
