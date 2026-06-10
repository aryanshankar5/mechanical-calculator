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

export default function VibratingFeederCalculator() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [loadingFields, setLoadingFields] = useState({
    bulkDensity: false,
  });
  const [form, setForm] = useState({
    material_name: "",
    bulk_density: "",
    required_capacity: 200,
    largest_lump_size: 150,
    large_size_material_percent: 40,
    trough_length: 3000,
    bed_depth: 180,
    slope: 5,
    stroke: 8,
    speed: 950,
    total_mass: 300,
    number_of_unbalance_motors: 2,
    number_of_springs: 4,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
      .get(`${API_URL}/vibrating-feeder-materials`)
      .then(async (response) => {
        const list = response.data.materials || [];
        setMaterials(list);

        if (list.length > 0) {
          const firstMaterial = list[0];

          setForm((prev) => ({
            ...prev,
            material_name: "",
            bulk_density: "",
          }));

          setMaterialSearch(firstMaterial);

          // Fetch density automatically for first material
          await fetchBulkDensity(firstMaterial);
        }
      })
      .catch((error) => {
        console.error("Failed to load feeder materials", error);
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
        `${API_URL}/vibrating-feeder-material-density/${encodeURIComponent(material)}`
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
    if (!form.material_name) {
      alert("Please select a material first");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/calculate-vibrating-feeder`,
        form
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Vibrating feeder calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!form.material_name) {
      alert("Please select a material first");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/generate-vibrating-feeder-pdf`,
        form,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "Vibrating_Feeder_Report.pdf";
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
        title="Vibrating Feeder Calculator"
        onBackClick={() => navigate("/")}
        logo="/sail-logo.png"
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <FormSection>
              <Section title="Material & Capacity Data">
                <div className="space-y-2 relative">
                  <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Material Name
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
                        material_name: "",
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
                                material_name: material,
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
                  label="Required Capacity"
                  value={form.required_capacity}
                  unit="TPH"
                  onChange={(value) =>
                    setForm({ ...form, required_capacity: value })
                  }
                  min={0}
                />

                <Input
                  label="Largest Lump Size"
                  value={form.largest_lump_size}
                  unit="mm"
                  onChange={(value) =>
                    setForm({ ...form, largest_lump_size: value })
                  }
                  min={0}
                />

                <Input
                  label="Large Size Material"
                  value={form.large_size_material_percent}
                  unit="%"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      large_size_material_percent: value,
                    })
                  }
                  min={0}
                  max={100}
                />
              </Section>

              <Section title="Trough & Motion Parameters">
                <Input
                  label="Trough Length"
                  value={form.trough_length}
                  unit="mm"
                  onChange={(value) =>
                    setForm({ ...form, trough_length: value })
                  }
                  min={0}
                />

                <Input
                  label="Bed Depth"
                  value={form.bed_depth}
                  unit="mm"
                  onChange={(value) => setForm({ ...form, bed_depth: value })}
                  min={0}
                />

                <Input
                  label="Slope"
                  value={form.slope}
                  unit="°"
                  onChange={(value) => setForm({ ...form, slope: value })}
                  min={0}
                  max={90}
                />

                <Input
                  label="Stroke"
                  value={form.stroke}
                  unit="mm"
                  onChange={(value) => setForm({ ...form, stroke: value })}
                  min={0}
                  step={0.1}
                />

                <Input
                  label="Speed"
                  value={form.speed}
                  unit="RPM"
                  onChange={(value) => setForm({ ...form, speed: value })}
                  min={0}
                />
              </Section>

              <Section title="Mass & Spring Configuration">
                <Input
                  label="Total Mass"
                  value={form.total_mass}
                  unit="kg"
                  onChange={(value) =>
                    setForm({ ...form, total_mass: value })
                  }
                  min={0}
                />

                <Input
                  label="Number of Motors"
                  value={form.number_of_unbalance_motors}
                  unit="pcs"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      number_of_unbalance_motors: value,
                    })
                  }
                  min={1}
                />

                <Input
                  label="Number of Springs"
                  value={form.number_of_springs}
                  unit="pcs"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      number_of_springs: value,
                    })
                  }
                  min={1}
                />
              </Section>

              <ButtonGroup>
                <Button
                  onClick={calculate}
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? "Calculating..." : "Calculate Feeder"}
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
                    title="Material Mass on Feeder"
                    value={result.material_mass_on_feeder}
                    unit="kg"
                  />

                  <ResultCard
                    title="Throw Classification"
                    value={result.throw_classification}
                    unit=""
                  />

                  <ResultCard
                    title="Motor Power Required"
                    value={result.motor_power_each_required}
                    unit="kW"
                  />

                  <ResultCard
                    title="Stiffness Per Spring"
                    value={result.stiffness_per_spring}
                    unit="N/mm"
                  />

                  <ResultCard
                    title="Material Velocity"
                    value={result.design_material_velocity}
                    unit="m/s"
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