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
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [form, setForm] = useState({
    rated_capacity: 200,
    material_name: "",
    bulk_density: "",
    margin: 1.1,
    design_capacity: "",
    lump_size: "",
    abrasiveness: "",
    belt_speed: "",
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
    beltSpeed: false,
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

  useEffect(() => {
    axios
      .get(`${API_URL}/conveyor-materials`)
      .then(async (response) => {
        const list = response.data.materials || [];
        setMaterials(list);

        if (list.length > 0) {
          const firstMaterial = list[0];

          const densityResponse = await axios.get(
            `${API_URL}/conveyor-material-density/${encodeURIComponent(firstMaterial)}`
          );

          setForm((prev) => ({
            ...prev,
            material_name: firstMaterial,
            bulk_density: densityResponse.data.bulk_density,
          }));

          setMaterialSearch(firstMaterial);
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

        const fetchBeltSpeedFromOldExcel = async (lumpSize, abrasiveness) => {
          if (!lumpSize || !abrasiveness) return;

          try {
            setLoadingFields((prev) => ({
              ...prev,
              beltSpeed: true,
            }));

            const response = await axios.post(
              `${API_URL}/conveyor-belt-speed-from-old-excel`,
              {
                lump_size: lumpSize,
                abrasiveness: abrasiveness,
              }
            );

            setForm((prev) => ({
              ...prev,
              belt_speed: response.data.belt_speed,
            }));
          } catch (error) {
            console.error("Belt speed fetch failed", error.response?.data || error);
          } finally {
            setLoadingFields((prev) => ({
              ...prev,
              beltSpeed: false,
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
                  unit="tph"
                  step="1"
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
                  step="0.1"
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
                  unit="tph"
                  step="1"
                  onChange={() => {}}
                />

                {loadingFields.designCapacity && (
                  <SmallSpinner text="Calculating design capacity..." />
                )}

            

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
                        material_name: "",
                        bulk_density: "",
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
                            onMouseDown={async () => {
                              try {
                                setLoadingFields((prev) => ({
                                  ...prev,
                                  bulkDensity: true,
                                }));

                                setMaterialSearch(material);
                                setShowMaterialDropdown(false);

                                const densityResponse = await axios.get(
                                  `${API_URL}/conveyor-material-density/${encodeURIComponent(material)}`
                                );

                                setForm((prev) => ({
                                  ...prev,
                                  material_name: material,
                                  bulk_density: Number(densityResponse.data.bulk_density),
                                }));
                              } catch (error) {
                                console.error(
                                  "Bulk density fetch failed",
                                  error.response?.data || error
                                );
                              } finally {
                                setLoadingFields((prev) => ({
                                  ...prev,
                                  bulkDensity: false,
                                }));
                              }
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

                  {/* {form.material_name && (
                    <p className="text-xs text-slate-500">
                      Selected: {form.material_name}
                    </p>
                  )} */}
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


                <Select
                  label="Belt Width"
                  value={form.belt_width}
                  options={beltWidthOptions}
                  unit="mm"
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
                        unit="mm"
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
                    step="0.1"
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
                    step="1"
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
                    step="1"
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
                    step="1"
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


                  <Select
                    label="Lump Size"
                    value={form.lump_size}
                    options={lumpSizeOptions}
                    onChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        lump_size: value,
                      }));

                      fetchBeltSpeedFromOldExcel(value, form.abrasiveness);
                    }}
                  />

                  <Select
                    label="Abrasiveness"
                    value={form.abrasiveness}
                    options={abrasivenessOptions}
                    onChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        abrasiveness: value,
                      }));

                      fetchBeltSpeedFromOldExcel(form.lump_size, value);
                    }}
                  />

                  <Input
                    label="Belt Speed"
                    value={form.belt_speed}
                    unit="m/s"
                    step="0.1"
                    onChange={(value) =>
                      setForm({
                        ...form,
                        belt_speed: Number(value),
                      })
                    }
                  />

                  {loadingFields.beltSpeed && (
                    <SmallSpinner text="Fetching belt speed..." />
                  )}

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
                    title="Gearbox Power"
                    value={result.gearbox_kw}
                    unit="kW"
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
                    title="DrivePulley Shaft Diameter"
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