import { useEffect, useState, useRef } from "react";
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

export default function ConveyorCalculator() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    rated_capacity: 200,
    material_name: "",
    bulk_density: "",
    margin: 1.1,
    design_capacity: "",

    belt_speed: 2.5,
    conveyor_length: 100,
    lift: 10,
    total_skirt_length: 5,

    belt_width: 800,
    idler_diameter: "",

    belt_type: "",
    carcass_thickness: "",
    drive_pulley_diameter: "",
    snub_pulley_diameter: "",
    tail_pulley_diameter: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState({
    designCapacity: false,
    bulkDensity: false,
    carcassThickness: false,
    pulleyDiameters: false,
  });

  const designCapacityTimer = useRef(null);

  const beltWidthOptions = [650, 800, 1000, 1200, 1400];
  const beltTypeOptions = ["315/3", "630/3", "630/4", "800/4", "1250/4"];
  const idlerDiameterMap = {
    650: [101.6, 114.3, 127],
    800: [114.3, 127, 139.7, 152.4],
    1000: [114.3, 127, 139.7, 152.4],
    1200: [114.3, 127, 139.7, 152.4],
    1400: [139.7, 152.4],
  };
  const idlerDiameterOptions = idlerDiameterMap[Number(form.belt_width)] || [];


  useEffect(() => {
    axios
      .get(`${API_URL}/conveyor-materials`)
      .then(async (response) => {
        const list = response.data.materials || [];
        setMaterials(list);

        if (list.length > 0) {
          const firstMaterial = list[0];

          const densityResponse = await axios.get(
            `${API_URL}/conveyor-material-density/${firstMaterial}`
          );

          setForm((prev) => ({
            ...prev,
            material_name: firstMaterial,
            bulk_density: densityResponse.data.bulk_density,
          }));
        }
      })
      .catch((error) => {
        console.error("Failed to load conveyor materials", error);
      });
  }, []);

    useEffect(() => {
    if (
      form.rated_capacity !== "" &&
      form.rated_capacity !== null &&
      form.margin !== "" &&
      form.margin !== null
    ) {
      fetchDesignCapacity(form.rated_capacity, form.margin);
    }
  }, [form.rated_capacity, form.margin]);

          const fetchDesignCapacity = async (ratedCapacity, margin) => {
            try {
              setLoadingFields((prev) => ({
                ...prev,
                designCapacity: true,
              }));

              const response = await axios.post(
                `${API_URL}/conveyor-design-capacity`,
                {
                  rated_capacity: Number(ratedCapacity),
                  margin: Number(margin),
                }
              );

              console.log("Design capacity response:", response.data);

              setForm((prev) => ({
                ...prev,
                design_capacity: response.data.design_capacity ?? "",
              }));
            } catch (error) {
              console.error("Design capacity fetch failed", error.response?.data || error);
            } finally {
              setLoadingFields((prev) => ({
                ...prev,
                designCapacity: false,
              }));
            }
          };

        const fetchBeltTypeValues = async (beltType) => {
          try {
            setLoadingFields((prev) => ({
              ...prev,
              carcassThickness: true,
            }));

            const response = await axios.post(
              `${API_URL}/conveyor-belt-type-values`,
              {
                belt_type: beltType,
              }
            );

            const carcassThickness = response.data.carcass_thickness;

            setForm((prev) => ({
              ...prev,
              carcass_thickness: carcassThickness,
            }));

            if (carcassThickness) {
              fetchPulleyValues(carcassThickness);
            }
          } catch (error) {
            console.error("Belt type values fetch failed", error.response?.data || error);
          } finally {
            setLoadingFields((prev) => ({
              ...prev,
              carcassThickness: false,
            }));
          }
        };

      const fetchPulleyValues = async (carcassThickness) => {
        try {
          setLoadingFields((prev) => ({
            ...prev,
            pulleyDiameters: true,
          }));

          const response = await axios.post(
            `${API_URL}/conveyor-pulley-values`,
            {
              carcass_thickness: Number(carcassThickness),
            }
          );

          setForm((prev) => ({
            ...prev,
            drive_pulley_diameter: response.data.drive_pulley_diameter,
            snub_pulley_diameter: response.data.snub_pulley_diameter,
            tail_pulley_diameter: response.data.tail_pulley_diameter,
          }));
        } catch (error) {
          console.error("Pulley values fetch failed", error.response?.data || error);
        } finally {
          setLoadingFields((prev) => ({
            ...prev,
            pulleyDiameters: false,
          }));
        }
      };



    const calculate = async () => {
      if (!form.material_name) {
        alert("Please select a material first");
        return;
      }

      if (!form.bulk_density) {
        alert("Bulk density not found for selected material");
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
        console.error(error.response?.data || error);
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
                  label="Rated Capacity"
                  value={form.rated_capacity}
                  unit="TPH"
                  onChange={(value) => {
                    const numericValue = Number(value);

                    setForm((prev) => ({
                      ...prev,
                      rated_capacity: numericValue,
                    }));

                    if (designCapacityTimer.current) {
                      clearTimeout(designCapacityTimer.current);
                    }

                    designCapacityTimer.current = setTimeout(() => {
                      fetchDesignCapacity(numericValue, form.margin);
                    }, 600);
                  }}
                />

                <Input
                  label="Margin"
                  value={form.margin}
                  unit="%"
                  onChange={(value) => {
                    const numericValue = Number(value);

                    setForm((prev) => ({
                      ...prev,
                      margin: numericValue,
                    }));

                    if (designCapacityTimer.current) {
                      clearTimeout(designCapacityTimer.current);
                    }

                    designCapacityTimer.current = setTimeout(() => {
                      fetchDesignCapacity(form.rated_capacity, numericValue);
                    }, 600);
                  }}
                />

                <Input
                  label="Design Capacity"
                  value={form.design_capacity}
                  unit="TPH"
                  onChange={() => {}}
                />

                {loadingFields.designCapacity && (
                  <SmallSpinner text="Calculating design capacity..." />
                )}

            

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Material
                  </label>

                  <select
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-base font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white cursor-pointer"
                    value={form.material_name}
                      onChange={async (e) => {
                        const selectedMaterial = e.target.value;

                        try {
                          setLoadingFields((prev) => ({
                            ...prev,
                            bulkDensity: true,
                          }));

                          const densityResponse = await axios.get(
                            `${API_URL}/conveyor-material-density/${selectedMaterial}`
                          );

                          setForm((prev) => ({
                            ...prev,
                            material_name: selectedMaterial,
                            bulk_density: Number(densityResponse.data.bulk_density),
                          }));
                        } catch (error) {
                          console.error("Bulk density fetch failed", error.response?.data || error);
                        } finally {
                          setLoadingFields((prev) => ({
                            ...prev,
                            bulkDensity: false,
                          }));
                        }
                      }}
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
                  label="Bulk Density"
                  value={form.bulk_density}
                  unit="t/m³"
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


                <Select
                  label="Belt Width"
                  value={form.belt_width}
                  options={beltWidthOptions}
                  onChange={(value) => {
                    const selectedBeltWidth = Number(value);
                    const availableIdlers = idlerDiameterMap[selectedBeltWidth] || [];

                    setForm({
                      ...form,
                      belt_width: selectedBeltWidth,
                      idler_diameter: availableIdlers.length > 0 ? availableIdlers[0] : "",
                    });
                  }}
                />

                      <Select
                        label="Idler Diameter"
                        value={form.idler_diameter}
                        options={idlerDiameterOptions}
                        onChange={(value) => {
                          setForm({
                            ...form,
                            idler_diameter: Number(value),
                          });
                        }}
                      />

                  <Select
                    label="Belt Type"
                    value={form.belt_type}
                    options={beltTypeOptions}
                    onChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        belt_type: value,
                      }));

                      fetchBeltTypeValues(value);
                    }}
                  />

                  <Input
                    label="Carcass Thickness"
                    value={form.carcass_thickness}
                    unit="mm"
                    onChange={(value) => {
                      const numericValue = Number(value);

                      setForm((prev) => ({
                        ...prev,
                        carcass_thickness: numericValue,
                      }));

                      fetchPulleyValues(numericValue);
                    }}
                  />

                  {loadingFields.carcassThickness && (
                    <SmallSpinner text="Fetching carcass thickness..." />
                  )}

                  <Input
                    label="Drive Pulley Diameter"
                    value={form.drive_pulley_diameter}
                    unit="mm"
                    onChange={(value) =>
                      setForm({
                        ...form,
                        drive_pulley_diameter: Number(value),
                      })
                    }
                  />

                  <Input
                    label="Snub Pulley Diameter"
                    value={form.snub_pulley_diameter}
                    unit="mm"
                    onChange={(value) =>
                      setForm({
                        ...form,
                        snub_pulley_diameter: Number(value),
                      })
                    }
                  />

                  <Input
                    label="Tail Pulley Diameter"
                    value={form.tail_pulley_diameter}
                    unit="mm"
                    onChange={(value) =>
                      setForm({
                        ...form,
                        tail_pulley_diameter: Number(value),
                      })
                    }
                  />

                  {loadingFields.pulleyDiameters && (
                    <SmallSpinner text="Fetching pulley diameters..." />
                  )}


                <Input
                  label="Belt Speed"
                  value={form.belt_speed}
                  unit="m/s"
                  onChange={(value) => setForm({ ...form, belt_speed: value })}
                />

                <Input
                  label="Conveyor Length"
                  value={form.conveyor_length}
                  unit="m"
                  step="1"
                  onChange={(value) => setForm({ ...form, conveyor_length: value })}
                />

                <Input
                  label="Lift"
                  value={form.lift}
                  unit="m"
                  step="1"
                  onChange={(value) => setForm({ ...form, lift: value })}
                />

                <Input
                  label="Total Skirt Length"
                  value={form.total_skirt_length}
                  unit="m"
                  step="1"
                  onChange={(value) => setForm({ ...form, total_skirt_length: value })}
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
                    title="Gearbox Reduction Ratio"
                    value={result.gearbox_reduction_ratio}
                    unit=""
                  />
                  <ResultCard
                    title="High Speed Coupling"
                    value={result.high_speed_coupling}
                    unit="kW/rpm"
                  />
                  <ResultCard
                    title="Low Speed Coupling"
                    value={result.low_speed_coupling}
                    unit="kW/rpm"
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