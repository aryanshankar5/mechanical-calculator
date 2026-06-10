import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Header,
  Section,
  Input,
  Select,
  ResultCard,
  Button,
  ResultsContainer,
  FormSection,
  ButtonGroup,
} from "../components/UIComponents";

const API_URL = import.meta.env.VITE_API_URL;

function SmallSpinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 mt-1 text-sm text-blue-600 font-medium">
      <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
      <span>{text}</span>
    </div>
  );
}

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
    bulk_density: "",
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
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [loadingFields, setLoadingFields] = useState({
    bulkDensity: false,
  });

  const filteredMaterials = materials
    .filter((material) =>
      material.toLowerCase().includes(materialSearch.toLowerCase())
    )
    .sort((a, b) => {
      const search = materialSearch.toLowerCase();

      const aStarts = a.toLowerCase().startsWith(search);
      const bStarts = b.toLowerCase().startsWith(search);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.localeCompare(b);
    });

  useEffect(() => {
    axios
      .get(`${API_URL}/vibrating-screen-materials`)
      .then((response) => {
        const list = response.data.materials || [];
        setMaterials(list);
        if (list.length > 0) {
          const firstMaterial = list[0];
          setForm((prev) => ({
            ...prev,
            material: firstMaterial,
          }));
          setMaterialSearch(firstMaterial);
        }
      })
      .catch((error) => {
        console.error("Failed to load materials", error);
      });
  }, []);

  const fetchBulkDensity = async (material) => {
    if (!material) return;

    try {
      setLoadingFields((prev) => ({
        ...prev,
        bulkDensity: true,
      }));

      const response = await axios.get(
        `${API_URL}/vibrating-screen-material-density/${encodeURIComponent(material)}`
      );

      setForm((prev) => ({
        ...prev,
        bulk_density: Number(response.data.bulk_density),
      }));
    } catch (error) {
      console.error("Bulk density fetch failed", error.response?.data || error);
    } finally {
      setLoadingFields((prev) => ({
        ...prev,
        bulkDensity: false,
      }));
    }
  };

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
      const url = window.URL.createObjectURL(new Blob([response.data]));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header
        title="Vibrating Screen Calculator"
        onBackClick={() => navigate("/")}
        logo="/sail-logo.png"
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <FormSection>
              <Section title="Feed & Material Data">
                <Input
                  label="Feed Capacity"
                  value={form.feed_capacity}
                  onChange={(value) =>
                    setForm({ ...form, feed_capacity: value })
                  }
                  unit="TPH"
                  min={0}
                />

                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Material
                  </label>

                  <input
                    type="text"
                    value={materialSearch}
                    placeholder="Search material..."
                    onFocus={() => setShowMaterialDropdown(true)}
                    onChange={(e) => {
                      setMaterialSearch(e.target.value);
                      setShowMaterialDropdown(true);

                      setForm((prev) => ({
                        ...prev,
                        material: "",
                      }));
                    }}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-base font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white"
                  />

                  {showMaterialDropdown && (
                    <div className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white border-2 border-slate-200 rounded-xl shadow-lg">
                      {filteredMaterials.length > 0 ? (
                        filteredMaterials.map((material, index) => (
                          <div
                            key={`${material}-${index}`}
                            onMouseDown={() => {
                              setMaterialSearch(material);
                              setShowMaterialDropdown(false);

                              setForm((prev) => ({
                                ...prev,
                                material: material,
                              }));

                              fetchBulkDensity(material);
                            }}
                            className="px-4 py-2 text-sm font-medium cursor-pointer hover:bg-blue-100"
                          >
                            {material}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-slate-500">
                          No material found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Input
                  label="Bulk Density"
                  value={form.bulk_density}
                  unit="t/m³"
                  step="0.1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      bulk_density: Number(value),
                    })
                  }
                />

                {loadingFields.bulkDensity && (
                  <SmallSpinner text="Fetching bulk density..." />
                )}

                <Input
                  label="Feed Size"
                  value={form.feed_size}
                  onChange={(value) =>
                    setForm({ ...form, feed_size: value })
                  }
                  unit="mm"
                  min={0}
                />

                <Input
                  label="Aperture Size"
                  value={form.aperture_size}
                  onChange={(value) =>
                    setForm({ ...form, aperture_size: value })
                  }
                  unit="mm"
                  min={0}
                />
              </Section>

              <Section title="Operating Conditions">
                <Input
                  label="Inclination"
                  value={form.inclination}
                  onChange={(value) =>
                    setForm({ ...form, inclination: value })
                  }
                  unit="°"
                  min={0}
                  max={90}
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

              <Section title="Screen Configuration">
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
                  min={0}
                  step={0.1}
                />

                <Input
                  label="Motor Speed"
                  value={form.motor_speed}
                  onChange={(value) =>
                    setForm({ ...form, motor_speed: value })
                  }
                  unit="RPM"
                  min={0}
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
                  min={0}
                />
              </Section>

              <ButtonGroup>
                <Button
                  onClick={calculate}
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? "Calculating..." : "Calculate Screen"}
                </Button>

                <Button
                  onClick={downloadPdf}
                  disabled={loading}
                  variant="success"
                >
                  Download PDF
                </Button>
              </ButtonGroup>
            </FormSection>
          </div>

          {/* RESULTS SECTION */}
          <div className="lg:col-span-1">
            <ResultsContainer title="Results" isEmpty={!result}>
              {result && (
                <>
                  <ResultCard
                    title="Screen Area"
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
                    title="Power Required"
                    value={result.power}
                    unit="kW"
                  />

                  <ResultCard
                    title="Screen Efficiency"
                    value={result.screen_efficiency}
                    unit="%"
                  />
                </>
              )}
            </ResultsContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
