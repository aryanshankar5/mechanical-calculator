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

export default function VibratingFeederCalculator() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    material_name: "",
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

  useEffect(() => {
    axios
      .get(`${API_URL}/vibrating-feeder-materials`)
      .then((response) => {
        const list = response.data.materials || [];
        setMaterials(list);
        if (list.length > 0) {
          setForm((prev) => ({
            ...prev,
            material_name: list[0],
          }));
        }
      })
      .catch((error) => {
        console.error("Failed to load feeder materials", error);
      });
  }, []);

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
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Material Name
                  </label>
                  <select
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-base font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white cursor-pointer"
                    value={form.material_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        material_name: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Material</option>
                    {materials.map((material, index) => (
                      <option key={`${material}-${index}`} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>

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