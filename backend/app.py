from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import xlwings as xw
import os

from report_generator import (
    generate_bearing_report,
    generate_vibrating_screen_report,
    generate_vibrating_feeder_report,
    generate_conveyor_report
)

from datetime import datetime


# =====================================================
# APP CONFIG
# =====================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# EXCEL CONFIGURATION
# =====================================================

WORKBOOK_NAME = "Bearing Life Calculator.xlsx"
SHEET_NAME = "Bearing Life Calculator"

INPUT_CELLS = {
    "bearing_type": "C6",
    "number_of_rows": "C7",
    "ball_diameter": "C8",

    "radial_load": "C11",
    "axial_load": "C12",

    "speed": "C15",
    "required_life": "C18"
}

OUTPUT_CELLS = {

    "size_factor": "C9",

    "load_rating": "C10",

    "radial_factor": "C13",
    "axial_factor": "C14",

    "equivalent_load": "C16",

    "exponent": "C17",

    "life_million_rev": "C19",

    "required_dynamic_capacity": "C20",
    "load_rating": "C10",

    "outer_diameter": "C25",
    "inner_diameter": "C26",
    "width": "C27",
    "number_of_balls": "C28"
}

# =====================================================
# PYDANTIC MODEL
# =====================================================

class BearingInput(BaseModel):
    bearing_type: str
    number_of_rows: int
    ball_diameter: float

    radial_load: float
    axial_load: float
    speed: float
    required_life: float

class VibratingScreenInput(BaseModel):
    feed_capacity: float
    material: str
    feed_size: float
    aperture_size: float
    inclination: float
    moisture_condition: str
    particle_shape: str
    screen_type: str
    number_of_decks: int
    stroke: float
    motor_speed: float
    weight_oscillating_part: float

# =====================================================
# HELPER FUNCTION
# =====================================================

def get_excel_path():
    return os.path.join(
        os.getcwd(),
        "excel",
        WORKBOOK_NAME
    )


def calculate_excel(data: BearingInput):

    excel_path = get_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets[SHEET_NAME]

        # -------------------------
        # Write Inputs
        # -------------------------

        # Bearing details
        sheet.range(INPUT_CELLS["bearing_type"]).value = data.bearing_type
        sheet.range(INPUT_CELLS["number_of_rows"]).value = data.number_of_rows
        sheet.range(INPUT_CELLS["ball_diameter"]).value = data.ball_diameter

        # Operating conditions
        sheet.range(INPUT_CELLS["radial_load"]).value = data.radial_load
        sheet.range(INPUT_CELLS["axial_load"]).value = data.axial_load
        sheet.range(INPUT_CELLS["speed"]).value = data.speed
        sheet.range(INPUT_CELLS["required_life"]).value = data.required_life

        # -------------------------
        # Recalculate Workbook
        # -------------------------

        wb.app.calculate()

        # -------------------------
        # Read Results
        # -------------------------

        results = {}

        for key, cell in OUTPUT_CELLS.items():
            results[key] = sheet.range(cell).value

        wb.close()

        return results

    finally:
        app_excel.quit()


# =====================================================
# ROUTES
# =====================================================

@app.get("/")
def home():
    return {
        "status": "running",
        "application": "Mechanical Calculator"
    }


@app.get("/test-excel")
def test_excel():

    excel_path = get_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets[SHEET_NAME]

        result = {
            "bearing_type": sheet.range("C6").value,
            "rows": sheet.range("C7").value,
            "ball_diameter": sheet.range("C8").value,
            "radial_load": sheet.range("C11").value,
            "axial_load": sheet.range("C12").value,
            "speed": sheet.range("C15").value,
            "required_life": sheet.range("C18").value
        }

        wb.close()

        return result

    finally:
        app_excel.quit()


@app.post("/calculate-bearing")
def calculate_bearing(data: BearingInput):

    return calculate_excel(data)


@app.post("/generate-pdf")
def generate_pdf(data: BearingInput):

    results = calculate_excel(data)

    report_data = {

        "report_title": "Bearing Design Report",
        "report_date": datetime.now().strftime("%d-%m-%Y"),

        "bearing_type": data.bearing_type,
        "number_of_rows": data.number_of_rows,
        "ball_diameter": data.ball_diameter,

        "radial_load": data.radial_load,
        "axial_load": data.axial_load,
        "speed": data.speed,
        "required_life": data.required_life,

        **results
    }

    pdf_file = generate_bearing_report(report_data)

    return FileResponse(
        pdf_file,
        media_type="application/pdf",
        filename="bearing_report.pdf"
    )

VIBRATING_WORKBOOK_NAME = "Vibrating Screen Calculator.xlsx"
VIBRATING_SHEET_NAME = "VSMA Screen Design"

VIBRATING_INPUT_CELLS = {
    "feed_capacity": "D6",
    "material": "D7",
    "feed_size": "D9",
    "aperture_size": "D10",
    "inclination": "D17",
    "moisture_condition": "D18",
    "particle_shape": "D19",
    "screen_type": "D27",
    "number_of_decks": "D28",
    "stroke": "D30",
    "motor_speed": "D31",
    "weight_oscillating_part": "D32",
}

VIBRATING_OUTPUT_CELLS = {

    # INPUT RELATED
    "bulk_density": "D8",

    # FACTORS
    "specific_feed_rate": "D11",
    "material_factor": "D12",
    "oversize_factor": "D13",
    "efficiency_factor": "D14",
    "half_size_cut_factor": "D15",
    "amplitude_factor": "D16",
    "moisture_factor": "D20",
    "shape_factor": "D21",
    "inclination_factor": "D22",
    "efficiency_requirement": "D23",
    "open_area_factor": "D24",
    "deck_factor": "D25",
    "amplitude": "D26",
    "motion_speed": "D29",

    # SCREEN EFFICIENCY TERMS
    "feed_size_a": "D33",
    "undersize_product_b": "D34",
    "oversize_product_c": "D35",

    # OUTPUTS
    "basic_capacity_factor": "D39",
    "efficiency_factor_e": "D40",
    "required_screen_area": "D41",
    "width": "D42",
    "length": "D43",
    "speed": "D44",
    "length_width_ratio": "D45",
    "angular_velocity": "D46",
    "radius": "D47",
    "g_force": "D48",
    "dynamic_load": "D49",
    "transport_speed": "D50",
    "bed_depth": "D51",
    "force": "D52",
    "power": "D53",
    "screen_efficiency": "D54",
}

def get_vibrating_excel_path():
    return os.path.join(
        os.getcwd(),
        "excel",
        VIBRATING_WORKBOOK_NAME
    )


def calculate_vibrating_screen_excel(data: VibratingScreenInput):

    excel_path = get_vibrating_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets[VIBRATING_SHEET_NAME]

        sheet.range(VIBRATING_INPUT_CELLS["feed_capacity"]).value = data.feed_capacity
        sheet.range(VIBRATING_INPUT_CELLS["material"]).value = data.material
        sheet.range(VIBRATING_INPUT_CELLS["feed_size"]).value = data.feed_size
        sheet.range(VIBRATING_INPUT_CELLS["aperture_size"]).value = data.aperture_size
        sheet.range(VIBRATING_INPUT_CELLS["inclination"]).value = data.inclination
        sheet.range(VIBRATING_INPUT_CELLS["moisture_condition"]).value = data.moisture_condition
        sheet.range(VIBRATING_INPUT_CELLS["particle_shape"]).value = data.particle_shape
        sheet.range(VIBRATING_INPUT_CELLS["screen_type"]).value = data.screen_type
        sheet.range(VIBRATING_INPUT_CELLS["number_of_decks"]).value = data.number_of_decks
        sheet.range(VIBRATING_INPUT_CELLS["stroke"]).value = data.stroke
        sheet.range(VIBRATING_INPUT_CELLS["motor_speed"]).value = data.motor_speed
        sheet.range(VIBRATING_INPUT_CELLS["weight_oscillating_part"]).value = data.weight_oscillating_part

        wb.app.calculate()

        results = {}

        for key, cell in VIBRATING_OUTPUT_CELLS.items():
            results[key] = sheet.range(cell).value

        wb.close()

        return results

    finally:
        app_excel.quit()


@app.post("/calculate-vibrating-screen")
def calculate_vibrating_screen(data: VibratingScreenInput):

    return calculate_vibrating_screen_excel(data)

@app.post("/generate-vibrating-screen-pdf")
def generate_vibrating_screen_pdf(data: VibratingScreenInput):

    results = calculate_vibrating_screen_excel(data)

    report_data = {
        **data.dict(),
        **results
    }

    pdf_path = generate_vibrating_screen_report(report_data)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="Vibrating_Screen_Report.pdf"
    )

@app.get("/vibrating-screen-materials")
def get_vibrating_screen_materials():

    excel_path = get_vibrating_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets["Density - IS8730"]

        materials = sheet.range("A2:A500").value

        wb.close()

        if not isinstance(materials, list):
            materials = [materials]

        materials = [
            str(item)
            for item in materials
            if item is not None
        ]

        return {
            "materials": materials
        }

    finally:
        app_excel.quit()

FEEDER_WORKBOOK_NAME = "Vibrating_Feeder_Complete_Design_Calculator.xlsx"
FEEDER_INPUT_SHEET = "Inputs"

FEEDER_INPUT_CELLS = {
    "material_name": "B4",
    "required_capacity": "B6",
    "largest_lump_size": "B7",
    "large_size_material_percent": "B8",
    "trough_length": "B9",
    "bed_depth": "B10",
    "slope": "B11",
    "stroke": "B12",
    "speed": "B13",
    "total_mass": "B15",
    "number_of_unbalance_motors": "B16",
    "number_of_springs": "B19",
}

FEEDER_OUTPUT_CELLS = {
    "bulk_density": ("Inputs", "B5"),
    "empty_vibrating_mass": ("Inputs", "B15"),

    "design_material_velocity": ("Design_Calc", "B4"),
    "required_feeder_width": ("Design_Calc", "B5"),
    "material_cross_sectional_area": ("Design_Calc", "B6"),
    "material_volume_on_feeder": ("Design_Calc", "B7"),
    "material_mass_on_feeder": ("Design_Calc", "B8"),
    "total_vibrating_mass_used": ("Design_Calc", "B9"),
    "throw_index": ("Design_Calc", "B10"),
    "throw_classification": ("Design_Calc", "B11"),

    "angular_speed": ("Motor", "B5"),
    "centrifugal_force_total": ("Motor", "B7"),
    "motor_power_each_required": ("Motor", "B10"),

    "stiffness_per_spring": ("Spring", "B8"),
}
def get_feeder_excel_path():
    return os.path.join(
        os.getcwd(),
        "excel",
        FEEDER_WORKBOOK_NAME
    )


class VibratingFeederInput(BaseModel):
    material_name: str
    required_capacity: float
    largest_lump_size: float
    large_size_material_percent: float
    trough_length: float
    bed_depth: float
    slope: float
    stroke: float
    speed: float
    total_mass: float
    number_of_unbalance_motors: int
    number_of_springs: int



def calculate_vibrating_feeder_excel(data: VibratingFeederInput):

    excel_path = get_feeder_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        input_sheet = wb.sheets[FEEDER_INPUT_SHEET]

        input_sheet.range(FEEDER_INPUT_CELLS["material_name"]).value = data.material_name
        input_sheet.range(FEEDER_INPUT_CELLS["required_capacity"]).value = data.required_capacity
        input_sheet.range(FEEDER_INPUT_CELLS["largest_lump_size"]).value = data.largest_lump_size
        input_sheet.range(FEEDER_INPUT_CELLS["large_size_material_percent"]).value = data.large_size_material_percent
       
        input_sheet.range(FEEDER_INPUT_CELLS["trough_length"]).value = data.trough_length
        input_sheet.range(FEEDER_INPUT_CELLS["bed_depth"]).value = data.bed_depth
        input_sheet.range(FEEDER_INPUT_CELLS["slope"]).value = data.slope
        input_sheet.range(FEEDER_INPUT_CELLS["stroke"]).value = data.stroke
        input_sheet.range(FEEDER_INPUT_CELLS["speed"]).value = data.speed
        input_sheet.range(FEEDER_INPUT_CELLS["total_mass"]).value = data.total_mass
        input_sheet.range(FEEDER_INPUT_CELLS["number_of_unbalance_motors"]).value = data.number_of_unbalance_motors
        input_sheet.range(FEEDER_INPUT_CELLS["number_of_springs"]).value = data.number_of_springs

        wb.app.calculate()

        results = {}

        for key, item in FEEDER_OUTPUT_CELLS.items():
            sheet_name, cell = item
            results[key] = wb.sheets[sheet_name].range(cell).value

        wb.close()

        return results

    finally:
        app_excel.quit()

@app.get("/vibrating-feeder-materials")
def get_vibrating_feeder_materials():

    excel_path = get_feeder_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets["Density - IS8730"]

        materials = sheet.range("A2:A500").value

        wb.close()

        if not isinstance(materials, list):
            materials = [materials]

        materials = [
            str(item)
            for item in materials
            if item is not None
        ]

        return {
            "materials": materials
        }

    finally:
        app_excel.quit()

@app.post("/calculate-vibrating-feeder")
def calculate_vibrating_feeder(data: VibratingFeederInput):

    return calculate_vibrating_feeder_excel(data)

@app.post("/generate-vibrating-feeder-pdf")
def generate_vibrating_feeder_pdf(data: VibratingFeederInput):

    results = calculate_vibrating_feeder_excel(data)

    report_data = {
        **data.dict(),
        **results
    }

    pdf_path = generate_vibrating_feeder_report(report_data)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="Vibrating_Feeder_Report.pdf"
    )

class ConveyorInput(BaseModel):
    required_capacity: float
    material_name: str
    lump_size_type: str
    abrasiveness_type: str
    belt_width_mm: float
    trough_angle: float
    surcharge_angle: float
    conveyor_length: float
    lift_elevation: float
    working_time: float
    pulley_diameter: float

CONVEYOR_WORKBOOK_NAME = "Conveyor Calculation.xlsx"
CONVEYOR_SHEET_NAME = "Belt Conveyor Motor Power Calcu"

CONVEYOR_INPUT_CELLS = {
    "required_capacity": "D5",
    "material_name": "D6",
    "lump_size_type": "D8",
    "abrasiveness_type": "D9",
    "belt_width_mm": "D13",
    "trough_angle": "D14",
    "surcharge_angle": "D15",
    "conveyor_length": "D18",
    "lift_elevation": "D19",
    "working_time": "D22",
    "pulley_diameter": "D33",
}

CONVEYOR_OUTPUT_CELLS = {
    "bulk_density": "D7",

    "speed_factor": "D10",
    "belt_speed": "D11",

    "initial_velocity": "D12",

    "belt_width_m": "D16",
    "cross_sectional_area": "D17",
    "slope_angle": "D20",
    "slope_factor": "D21",
    "service_factor": "D23",

    "artificial_friction_coefficient": "D24",
    "mass_carrying_idlers": "D25",
    "mass_return_idlers": "D26",
    "mass_belt": "D27",
    "friction_material_belt": "D28",
    "friction_material_skirt": "D29",
    "skirt_width": "D30",
    "skirt_length": "D31",
    "belt_thickness": "D32",
    "shaft_diameter_at_bearing": "D34",
    "vector_sum_tensions": "D35",
    "average_belt_tension": "D36",
    "trough_factor": "D37",
    "friction_idler_belt": "D38",
    "length_tilted_idlers": "D39",
    "idler_tilt_angle": "D40",
    "cleaner_pressure": "D41",
    "friction_belt_cleaner": "D42",
    "scraping_factor": "D43",
    "drive_efficiency": "D44",
    "gravity": "D45",
    "drive_coefficient": "D46",
    "wrap_angle": "D47",
    "external_cleaner_count": "D48",
    "internal_cleaner_count": "D49",
    "external_cleaner_thickness": "D50",
    "internal_cleaner_thickness": "D51",
    "external_cleaner_pressure": "D52",
    "internal_cleaner_pressure": "D53",

    "pulley_face_width": "D54",
    "allowable_shear_stress": "D55",
    "motor_speed": "D56",
    "selected_motor_rating": "D57",

    "conveyor_capacity": "D64",
    "volumetric_capacity": "D65",
    "mass_handled_material": "D66",
    "main_resistance": "D67",
    "slope_resistance": "D68",
    "accel_length": "D69",
    "accel_resistance_inertial": "D70",
    "skirt_accel_resistance": "D71",
    "wrap_resistance": "D72",
    "bearing_resistance": "D73",
    "secondary_resistance": "D74",
    "idler_tilt_resistance": "D75",
    "skirt_resistance_main": "D76",
    "belt_cleaner_resistance": "D77",
    "discharge_plough_resistance": "D78",
    "special_resistance": "D79",

    "drive_pulley_rpm": "D87",
    "drive_wrap_resistance": "D80",
    "drive_bearing_resistance": "D81",
    "effective_tension": "D82",
    "power_at_drive_pulley": "D83",
    "absorbed_power": "D84",
    "motor_power": "D85",
    "gearbox_power": "D86",
    "tight_side_tension": "D49",
    "slack_side_tension": "D50",
    "high_speed_coupling": "D88",
    "low_speed_coupling": "D89",

    "resultant_pulley_load": "D99",
    "maximum_bending_moment": "D100",
    "equivalent_torque": "D101",
    "pulley_shaft_diameter": "D103",
}

def get_conveyor_excel_path():
    return os.path.join(
        os.getcwd(),
        "excel",
        CONVEYOR_WORKBOOK_NAME
    )


def calculate_conveyor_excel(data: ConveyorInput):

    excel_path = get_conveyor_excel_path()
    
    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)
        sheet = wb.sheets[CONVEYOR_SHEET_NAME]

        for key, cell in CONVEYOR_INPUT_CELLS.items():
            sheet.range(cell).value = getattr(data, key)

        wb.app.calculate()


        results = {}

        for key, cell in CONVEYOR_OUTPUT_CELLS.items():
            results[key] = sheet.range(cell).value

        wb.close()

        return results

    finally:
        app_excel.quit()

@app.post("/calculate-conveyor")
def calculate_conveyor(data: ConveyorInput):

    return calculate_conveyor_excel(data)


@app.get("/conveyor-materials")
def get_conveyor_materials():

    excel_path = get_conveyor_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets["Density - IS8730"]

        materials = sheet.range("A2:A500").value

        wb.close()

        materials = [
            str(item)
            for item in materials
            if item is not None
        ]

        materials = list(dict.fromkeys(materials))

        return {
            "materials": materials
        }

    finally:
        app_excel.quit()


@app.post("/generate-conveyor-pdf")
def generate_conveyor_pdf(data: ConveyorInput):

    results = calculate_conveyor_excel(data)

    report_data = {
        **data.dict(),
        **results,

        # not separately calculated in Excel
        "lump_size_factor": "-",
        "abrasiveness_factor": "-",

        # fallback values if Excel cells are not mapped
        "initial_velocity": results.get("initial_velocity", 0),
        "artificial_friction_coefficient": results.get("artificial_friction_coefficient", "-"),
        "mass_carrying_idlers": results.get("mass_carrying_idlers", "-"),
        "mass_return_idlers": results.get("mass_return_idlers", "-"),
        "mass_belt": results.get("mass_belt", "-"),
        "friction_material_belt": results.get("friction_material_belt", "-"),
        "friction_material_skirt": results.get("friction_material_skirt", "-"),
        "skirt_width": results.get("skirt_width", "-"),
        "skirt_length": results.get("skirt_length", "-"),
        "belt_thickness": results.get("belt_thickness", "-"),
        "shaft_diameter_at_bearing": results.get("shaft_diameter_at_bearing", "-"),
        "vector_sum_tensions": results.get("vector_sum_tensions", "-"),
        "average_belt_tension": results.get("average_belt_tension", "-"),
        "trough_factor": results.get("trough_factor", "-"),
        "friction_idler_belt": results.get("friction_idler_belt", "-"),
        "length_tilted_idlers": results.get("length_tilted_idlers", "-"),
        "idler_tilt_angle": results.get("idler_tilt_angle", "-"),
        "cleaner_pressure": results.get("cleaner_pressure", "-"),
        "friction_belt_cleaner": results.get("friction_belt_cleaner", "-"),
        "scraping_factor": results.get("scraping_factor", "-"),
        "drive_efficiency": results.get("drive_efficiency", "-"),
        "gravity": results.get("gravity", "-"),
        "drive_coefficient": results.get("drive_coefficient", "-"),
        "wrap_angle": results.get("wrap_angle", "-"),
        "wrap_angle_radian": results.get("wrap_angle_radian", "-"),
        "external_cleaner_count": results.get("external_cleaner_count", "-"),
        "internal_cleaner_count": results.get("internal_cleaner_count", "-"),
        "external_cleaner_thickness": results.get("external_cleaner_thickness", "-"),
        "internal_cleaner_thickness": results.get("internal_cleaner_thickness", "-"),
        "external_cleaner_pressure": results.get("external_cleaner_pressure", "-"),
        "internal_cleaner_pressure": results.get("internal_cleaner_pressure", "-"),

        "tight_side_tension": results.get("tight_side_tension", "-"),
        "slack_side_tension": results.get("slack_side_tension", "-"),
        "selected_motor_rating": results.get("selected_motor_rating", "-"),
    }

    pdf_path = generate_conveyor_report(report_data)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="Conveyor_Report.pdf"
    )

