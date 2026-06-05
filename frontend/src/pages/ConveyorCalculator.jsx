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

const lumpSizeOptions = [
  "Fine Grain to Dust",
  "Granular",
  "Sized",
  "Unsized",
];

const abrasivenessOptions = [
  "Non Abrasiveness",
  "Mildly Abrasiveness",
  "Abrasiveness",
  "Very Abrasiveness",
];

export default function ConveyorCalculator() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    required_capacity: 200,
    material_name: "",
    lump_size_type: "Sized",
    abrasiveness_type: "Non Abrasiveness",
    belt_width_mm: 800,
    trough_angle: 35,
    surcharge_angle: 20,
    conveyor_length: 100,
    lift_elevation: 10,
    working_time: 8,
    pulley_diameter: 0.5,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/conveyor-materials`)
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
        console.error("Failed to load conveyor materials", error);
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
        `${API_URL}/calculate-conveyor`,
        form
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Conveyor calculation failed");
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
        `${API_URL}/generate-conveyor-pdf`,
        form,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "Conveyor_Report.pdf";
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
        title="Conveyor Calculator"
        onBackClick={() => navigate("/")}
        logo="/sail-logo.png"
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <FormSection>
              <Section title="Material & Capacity Data">
                <Input
                  label="Required Capacity"
                  value={form.required_capacity}
                  unit="TPH"
                  onChange={(value) =>
                    setForm({ ...form, required_capacity: value })
                  }
                  min={0}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Material
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

                <Select
                  label="Lump Size Type"
                  value={form.lump_size_type}
                  options={lumpSizeOptions}
                  onChange={(value) =>
                    setForm({ ...form, lump_size_type: value })
                  }
                />

                <Select
                  label="Abrasiveness Level"
                  value={form.abrasiveness_type}
                  options={abrasivenessOptions}
                  onChange={(value) =>
                    setForm({ ...form, abrasiveness_type: value })
                  }
                />
              </Section>

              <Section title="Belt & Geometry">
                <Input
                  label="Belt Width"
                  value={form.belt_width_mm}
                  unit="mm"
                  onChange={(value) =>
                    setForm({ ...form, belt_width_mm: value })
                  }
                  min={0}
                />

                <Input
                  label="Trough Angle"
                  value={form.trough_angle}
                  unit="°"
                  onChange={(value) =>
                    setForm({ ...form, trough_angle: value })
                  }
                  min={0}
                  max={90}
                />

                <Input
                  label="Surcharge Angle"
                  value={form.surcharge_angle}
                  unit="°"
                  onChange={(value) =>
                    setForm({ ...form, surcharge_angle: value })
                  }
                  min={0}
                  max={90}
                />

                <Input
                  label="Conveyor Length"
                  value={form.conveyor_length}
                  unit="m"
                  onChange={(value) =>
                    setForm({ ...form, conveyor_length: value })
                  }
                  min={0}
                />

                <Input
                  label="Lift / Elevation"
                  value={form.lift_elevation}
                  unit="m"
                  onChange={(value) =>
                    setForm({ ...form, lift_elevation: value })
                  }
                  min={0}
                />
              </Section>

              <Section title="Drive System">
                <Input
                  label="Working Time"
                  value={form.working_time}
                  unit="hr"
                  onChange={(value) =>
                    setForm({ ...form, working_time: value })
                  }
                  min={0}
                />

                <Input
                  label="Pulley Diameter"
                  value={form.pulley_diameter}
                  unit="m"
                  onChange={(value) =>
                    setForm({ ...form, pulley_diameter: value })
                  }
                  min={0}
                  step={0.01}
                />
              </Section>

              <ButtonGroup>
                <Button
                  onClick={calculate}
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? "Calculating..." : "Calculate Conveyor"}
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
                    title="Mass of Material"
                    value={result.mass_handled_material}
                    unit="kg/m"
                  />
                  <ResultCard
                    title="Effective Tension"
                    value={result.effective_tension}
                    unit="N"
                  />
                  <ResultCard
                    title="Motor Power"
                    value={result.motor_power}
                    unit="kW"
                  />
                  <ResultCard
                    title="Gearbox Power"
                    value={result.gearbox_power}
                    unit="kW"
                  />
                  <ResultCard
                    title="High Speed Coupling"
                    value={result.high_speed_coupling}
                    unit="N-m"
                  />
                  <ResultCard
                    title="Low Speed Coupling"
                    value={result.low_speed_coupling}
                    unit="N-m"
                  />
                  <ResultCard
                    title="Pulley Shaft Diameter"
                    value={result.pulley_shaft_diameter}
                    unit="mm"
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