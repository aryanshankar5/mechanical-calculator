const API_URL = import.meta.env.VITE_API_URL;
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

const bearingTypeOptions = [
  "Deep Groove Ball Bearing",
  "Spherical Roller Bearing",
];

export default function BearingCalculator() {
  const navigate = useNavigate();

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
      const response = await axios.post(`${API_URL}/calculate-bearing`, form);
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
      const url = window.URL.createObjectURL(new Blob([response.data]));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header
        title="Bearing Life Calculator"
        onBackClick={() => navigate("/")}
        logo="/sail-logo.png"
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2">
            <FormSection>
              <Section title="Bearing Specifications">
                <Select
                  label="Type of Bearing"
                  value={form.bearing_type}
                  options={bearingTypeOptions}
                  onChange={(value) =>
                    setForm({ ...form, bearing_type: value })
                  }
                  placeholder="Select bearing type"
                />

                <Input
                  label="Number of Rows"
                  value={form.number_of_rows}
                  unit="rows"
                  onChange={(value) =>
                    setForm({ ...form, number_of_rows: value })
                  }
                  min={1}
                  max={10}
                />

                <Input
                  label="Ball Diameter"
                  value={form.ball_diameter}
                  unit="mm"
                  onChange={(value) =>
                    setForm({ ...form, ball_diameter: value })
                  }
                  min={1}
                  step={0.1}
                />
              </Section>

              <Section title="Operating Conditions">
                <Input
                  label="Radial Load"
                  value={form.radial_load}
                  unit="N"
                  onChange={(value) =>
                    setForm({ ...form, radial_load: value })
                  }
                  min={0}
                />

                <Input
                  label="Axial Load"
                  value={form.axial_load}
                  unit="N"
                  onChange={(value) =>
                    setForm({ ...form, axial_load: value })
                  }
                  min={0}
                />

                <Input
                  label="Rotational Speed"
                  value={form.speed}
                  unit="RPM"
                  onChange={(value) => setForm({ ...form, speed: value })}
                  min={0}
                />

                <Input
                  label="Life Required"
                  value={form.required_life}
                  unit="Hours"
                  onChange={(value) =>
                    setForm({ ...form, required_life: value })
                  }
                  min={0}
                />
              </Section>

              <ButtonGroup>
                <Button
                  onClick={calculate}
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? "Calculating..." : "Calculate Bearing"}
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
            <ResultsContainer
              title="Results"
              isEmpty={!result}
            >
              {result && (
                <>
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
                    title="Number of Balls"
                    value={result.number_of_balls}
                    unit="pcs"
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