from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from urllib.parse import unquote
from typing import Optional

import threading

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
excel_lock = threading.Lock()

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
    rated_capacity: float
    material_name: str
    bulk_density: float
    margin: float
    lump_size: str
    abrasiveness: str
    belt_speed: float
    conveyor_length: float
    lift: float
    total_skirt_length: float
    belt_width: float
    idler_diameter: float
    belt_type: str
    carcass_thickness: float
    drive_pulley_diameter: float
    snub_pulley_diameter: float
    tail_pulley_diameter: float



CONVEYOR_WORKBOOK_NAME = "Conveyor Calculation Official.xlsx"
CONVEYOR_MATERIAL_WORKBOOK_NAME = "Conveyor Calculation.xlsx"
CONVEYOR_SHEET_NAME = "Belt Conveyor Motor Power Calcu"

CONVEYOR_INPUT_CELLS = {
    "rated_capacity": ("INPUT SHEET", "C5"),

    "margin": ("POWER", "B5"),
    "bulk_density": ("POWER", "B8"),
    "belt_width": ("POWER", "B12"),

    "belt_type": ("POWER", "K20"),
    "carcass_thickness": ("POWER", "B56"),

    "belt_speed": ("INPUT SHEET", "F5"),
    "conveyor_length": ("INPUT SHEET", "E5"),
    "lift": ("INPUT SHEET", "D5"),
    "total_skirt_length": ("INPUT SHEET", "G5"),

    "idler_diameter": ("POWER", "B39"),

    "drive_pulley_diameter": ("POWER", "B167"),
    "snub_pulley_diameter": ("POWER", "B168"),
    "tail_pulley_diameter": ("POWER", "B169"),
}

CONVEYOR_OUTPUT_CELLS = {
    # Input/result repeated values
    "design_capacity": ("POWER", "B6"),

    # Basic resistance inputs
    "artificial_friction_coefficient": ("POWER", "B33"),
    "conveyor_length_excel": ("POWER", "B34"),
    "gravity": ("POWER", "B35"),
    "slope_angle": ("POWER", "B36"),
    "cos_slope_angle": ("POWER", "B37"),

    # Idler and belt mass values
    "mass_carrying_idlers": ("POWER", "B48"),
    "mass_return_idlers": ("POWER", "B54"),
    "mass_belt": ("POWER", "B59"),
    "mass_handled_material": ("POWER", "B61"),

    # Main resistance
    "main_resistance": ("POWER", "B62"),

    # Secondary resistance
    "initial_velocity": ("POWER", "D68"),
    "volumetric_capacity": ("POWER", "D69"),
    "friction_material_skirt": ("POWER", "D72"),
    "acceleration_length": ("POWER", "D73"),
    "skirt_width": ("POWER", "D74"),

    "acceleration_resistance": ("POWER", "B68"),
    "skirt_acceleration_resistance": ("POWER", "B73"),
    "tight_side_pulley_count": ("POWER", "D77"),
    "slack_side_pulley_count": ("POWER", "D78"),
    "tight_side_wrap_resistance": ("POWER", "B80"),
    "slack_side_wrap_resistance": ("POWER", "B81"),
    "wrap_resistance": ("POWER", "B78"),
    "bearing_resistance_per_pulley": ("POWER", "B89"),
    "non_drive_pulley_count": ("POWER", "B90"),
    "bearing_resistance": ("POWER", "B92"),
    "secondary_resistance": ("POWER", "B94"),

    # Special resistance
    "trough_factor": ("POWER", "D98"),
    "friction_idler_belt": ("POWER", "D99"),
    "length_tilted_idlers": ("POWER", "D100"),
    "sin_idler_tilt_angle": ("POWER", "D102"),
    "idler_tilt_resistance": ("POWER", "B104"),

    "skirt_resistance_main": ("POWER", "B108"),
    "special_main_resistance": ("POWER", "B110"),

    "belt_cleaner_area": ("POWER", "D112"),
    "cleaner_pressure": ("POWER", "D117"),
    "friction_belt_cleaner": ("POWER", "D116"),
    "belt_cleaner_resistance": ("POWER", "B116"),

    "discharge_plough_resistance": ("POWER", "B118"),
    "special_secondary_resistance": ("POWER", "B119"),

    # Final special resistance used in report
    # This one will be calculated in Python as:
    # special_resistance = special_main_resistance + special_secondary_resistance

    # Slope resistance
    "slope_resistance": ("POWER", "B125"),

    # Effective tension and drive pulley power
    "effective_tension": ("POWER", "B131"),
    "power_at_drive_pulley": ("POWER", "B135"),
    "drive_wrap_resistance": ("POWER", "D135"),
    "drive_bearing_resistance": ("POWER", "D136"),
    "absorbed_power": ("POWER", "B137"),

    # Motor power
    "motor_factor": ("POWER", "D138"),
    "transmission_efficiency": ("POWER", "D139"),
    "derating_factor": ("POWER", "D140"),
    "motor_power": ("POWER", "B140"),
    "motor_speed": ("POWER", "B142"),
    "selected_motor_rating": ("POWER", "B144"),

    # Belt tensions
    "coupling_factor": ("POWER", "D149"),
    "friction_drive_factor": ("POWER", "D148"),
    "slack_side_tension": ("POWER", "B151"),
    "tight_side_tension": ("POWER", "B156"),

    # Gearbox
    "gearbox_service_factor": ("POWER", "B173"),  # if you want 1.8 separately, use fixed value in report_data
    "gearbox_kw": ("POWER", "B173"),
    "drive_pulley_rpm": ("POWER", "B175"),
    "gearbox_reduction_ratio": ("POWER", "B176"),
    "selected_reduction_ratio": ("POWER", "B177"),
    "gearbox_stages": ("POWER", "B178"),

    # Couplings and brake
    "high_speed_coupling": ("POWER", "B182"),
    "actual_output_rpm": ("POWER", "B186"),
    "low_speed_coupling": ("POWER", "B187"),
    "braking_torque": ("POWER", "B191"),

    # Pulley shaft calculation
    "pulley_speed": ("POWER", "B196"),
    "torsional_moment": ("POWER", "B198"),
    "sin_alpha": ("POWER", "B200"),
    "cos_alpha": ("POWER", "B201"),
    "drive_pulley_weight": ("POWER", "B202"),
    "resultant_pulley_load": ("POWER", "B203"),
    "bearing_load": ("POWER", "B204"),
    "bending_moment_arm": ("POWER", "B205"),
    "maximum_bending_moment": ("POWER", "B206"),
    "calculated_shaft_diameter": ("POWER", "B207"),
    "pulley_shaft_diameter": ("POWER", "B208"),

    # For report placeholder
    "allowable_shear_stress": ("POWER", "B207"),
}

def get_conveyor_material_excel_path():
    return os.path.join(
        os.getcwd(),
        "excel",
        CONVEYOR_MATERIAL_WORKBOOK_NAME
    )


def get_conveyor_excel_path():
    return os.path.join(
        os.getcwd(),
        "excel",
        CONVEYOR_WORKBOOK_NAME
    )


def calculate_conveyor_excel(data: ConveyorInput):

    with excel_lock:
        excel_path = get_conveyor_excel_path()

        app_excel = None
        wb = None

        try:
            app_excel = xw.App(visible=False)
            wb = app_excel.books.open(excel_path)

            # write inputs
            for key, item in CONVEYOR_INPUT_CELLS.items():
                sheet_name, cell = item
                value = getattr(data, key)

                if value not in [None, ""]:
                    wb.sheets[sheet_name].range(cell).value = value

            wb.app.calculate()

            results = {}

            # read outputs
            for key, item in CONVEYOR_OUTPUT_CELLS.items():
                sheet_name, cell = item
                results[key] = wb.sheets[sheet_name].range(cell).value

            # combined placeholders used in DOCX
            results["special_resistance"] = (
                (results.get("special_main_resistance") or 0)
                + (results.get("special_secondary_resistance") or 0)
            )

            results["equivalent_torque"] = (
                ((2 * (results.get("maximum_bending_moment") or 0)) ** 2
                 + (1.5 * (results.get("torsional_moment") or 0)) ** 2) ** 0.5
            )

            # constants used in report
            results["gearbox_service_factor"] = 1.8
            results["coupling_service_factor"] = 1.5
            results["allowable_shear_stress"] = 6.374

            wb.close()
            wb = None

            return results

        finally:
            if wb is not None:
                try:
                    wb.close()
                except:
                    pass

            if app_excel is not None:
                try:
                    app_excel.quit()
                except:
                    pass

@app.post("/conveyor-design-capacity")
def conveyor_design_capacity(data: dict = Body(...)):

    with excel_lock:
        excel_path = get_conveyor_excel_path()

        app_excel = None
        wb = None

        try:
            app_excel = xw.App(visible=False)
            wb = app_excel.books.open(excel_path)

            power = wb.sheets["POWER"]
            input_sheet = wb.sheets["INPUT SHEET"]

            rated_capacity = data.get("rated_capacity")
            margin = data.get("margin")

            if rated_capacity not in [None, ""]:
                input_sheet.range("C5").value = rated_capacity

            if margin not in [None, ""]:
                power.range("B5").value = margin

            wb.app.calculate()

            result = {
                "design_capacity": power.range("B6").value
            }

            wb.close()
            wb = None

            return result

        finally:
            if wb is not None:
                try:
                    wb.close()
                except:
                    pass

            if app_excel is not None:
                try:
                    app_excel.quit()
                except:
                    pass

@app.post("/conveyor-belt-type-values")
def conveyor_belt_type_values(data: dict = Body(...)):
  with excel_lock:
    excel_path = get_conveyor_excel_path()

    app_excel = xw.App(visible=False)
    wb = None

    try:
        wb = app_excel.books.open(excel_path)

        power = wb.sheets["POWER"]

        belt_type = data.get("belt_type")

        if belt_type not in [None, ""]:
            power.range("K20").value = belt_type

        wb.app.calculate()

        result = {
            "carcass_thickness": power.range("B56").value
        }

        wb.close()
        wb = None
        return result

    finally:
        if wb is not None:
            try:
                wb.close()
            except:
                pass

        try:
            app_excel.quit()
        except:
            pass

@app.post("/conveyor-pulley-values")
def conveyor_pulley_values(data: dict = Body(...)):
  with excel_lock:
    excel_path = get_conveyor_excel_path()

    app_excel = xw.App(visible=False)
    wb = None

    try:
        wb = app_excel.books.open(excel_path)

        power = wb.sheets["POWER"]

        carcass_thickness = data.get("carcass_thickness")

        if carcass_thickness not in [None, ""]:
            power.range("B56").value = carcass_thickness

        wb.app.calculate()

        result = {
            "drive_pulley_diameter": power.range("B167").value,
            "snub_pulley_diameter": power.range("B168").value,
            "tail_pulley_diameter": power.range("B169").value,
        }

        wb.close()
        wb = None
        return result

    finally:
        if wb is not None:
            try:
                wb.close()
            except:
                pass

        try:
            app_excel.quit()
        except:
            pass


@app.post("/conveyor-live-values")
def conveyor_live_values(data: dict = Body(...)):

    excel_path = get_conveyor_excel_path()

    app_excel = xw.App(visible=False)
    wb = None

    try:
        wb = app_excel.books.open(excel_path)

        for key, item in CONVEYOR_INPUT_CELLS.items():

            # Skip if frontend has not sent this key
            if key not in data:
                continue

            value = data.get(key)

            # Skip empty values
            if value in [None, ""]:
                continue

            sheet_name, cell = item
            wb.sheets[sheet_name].range(cell).value = value

        wb.app.calculate()

        power = wb.sheets["POWER"]

        result = {
            "design_capacity": power.range("B6").value,
            "carcass_thickness": power.range("B56").value,
            "drive_pulley_diameter": power.range("B167").value,
            "snub_pulley_diameter": power.range("B168").value,
            "tail_pulley_diameter": power.range("B169").value,
        }

        wb.close()
        return result

    finally:
        if wb is not None:
            try:
                wb.close()
            except:
                pass

        try:
            app_excel.quit()
        except:
            pass


@app.post("/calculate-conveyor")
def calculate_conveyor(data: ConveyorInput):

    return calculate_conveyor_excel(data)

@app.post("/conveyor-belt-speed-from-old-excel")
def get_belt_speed_from_old_excel(data: dict = Body(...)):

    with excel_lock:
        excel_path = get_conveyor_material_excel_path()

        app_excel = None
        wb = None

        try:
            print("OLD EXCEL PATH:", excel_path)
            print("RECEIVED DATA:", data)

            if not os.path.exists(excel_path):
                raise FileNotFoundError(f"Old conveyor Excel not found: {excel_path}")

            app_excel = xw.App(visible=False)
            wb = app_excel.books.open(excel_path)

            print("AVAILABLE SHEETS:", [s.name for s in wb.sheets])

            sheet = wb.sheets["Belt Conveyor Motor Power"]

            lump_size = data.get("lump_size")
            abrasiveness = data.get("abrasiveness")

            print("LUMP SIZE:", lump_size)
            print("ABRASIVENESS:", abrasiveness)

            if lump_size not in [None, ""]:
                sheet.range("D8").value = lump_size

            if abrasiveness not in [None, ""]:
                sheet.range("D9").value = abrasiveness

            wb.app.calculate()

            belt_speed = sheet.range("D11").value

            print("BELT SPEED FROM OLD EXCEL:", belt_speed)

            wb.close()
            wb = None

            return {
                "belt_speed": belt_speed
            }

        except Exception as e:
            print("BELT SPEED OLD EXCEL ERROR:", str(e))
            raise

        finally:
            if wb is not None:
                try:
                    wb.close()
                except:
                    pass

            if app_excel is not None:
                try:
                    app_excel.quit()
                except:
                    pass
                
@app.get("/conveyor-materials")
def get_conveyor_materials():
  with excel_lock:
    excel_path = get_conveyor_material_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets["Density - IS8730"]

        materials = sheet.range("A2:A500").value

        wb.close()

        if not isinstance(materials, list):
            materials = [materials]

        materials = [
            str(item).strip()
            for item in materials
            if item is not None
        ]

        materials = list(dict.fromkeys(materials))

        return {
            "materials": materials
        }

    finally:
        app_excel.quit()

@app.get("/conveyor-material-density/{material_name}")
def get_conveyor_material_density(material_name: str):
  with excel_lock:
    excel_path = get_conveyor_material_excel_path()

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        sheet = wb.sheets["Density - IS8730"]

        data = sheet.range("A2:B500").value

        wb.close()

        for row in data:
            if row and row[0]:
                if str(row[0]).strip().lower() == material_name.strip().lower():
                    return {
                        "material": row[0],
                        "bulk_density": row[1]
                    }

        return {
            "material": material_name,
            "bulk_density": ""
        }

    finally:
        app_excel.quit()


@app.post("/generate-conveyor-pdf")
def generate_conveyor_pdf(data: ConveyorInput):

    try:
        results = calculate_conveyor_excel(data)

        report_data = {
            # inputs
            "rated_capacity": data.rated_capacity,
            "margin": data.margin,
            "design_capacity": results.get("design_capacity"),
            "material_name": data.material_name,
            "bulk_density": data.bulk_density,
            "lump_size": data.lump_size,
            "abrasiveness": data.abrasiveness,
            "belt_speed": data.belt_speed,
            "conveyor_length": data.conveyor_length,
            "lift": data.lift,
            "total_skirt_length": data.total_skirt_length,
            "belt_width": data.belt_width,
            "idler_diameter": data.idler_diameter,
            "belt_type": data.belt_type,
            "carcass_thickness": data.carcass_thickness,
            "drive_pulley_diameter": data.drive_pulley_diameter,
            "snub_pulley_diameter": data.snub_pulley_diameter,
            "tail_pulley_diameter": data.tail_pulley_diameter,

            # calculated placeholders
            **results,
        }

        pdf_path = generate_conveyor_report(report_data)

        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename="Conveyor_Report.pdf"
        )

    except Exception as e:
        print("CONVEYOR PDF ERROR:", str(e))
        raise


@app.get("/vibrating-feeder-material-density/{material_name}")
def get_vibrating_feeder_material_density(material_name: str):

    with excel_lock:
        excel_path = get_feeder_excel_path()

        app_excel = None
        wb = None

        try:
            app_excel = xw.App(visible=False)
            wb = app_excel.books.open(excel_path)

            sheet = wb.sheets["Density - IS8730"]

            data = sheet.range("A2:B500").value

            wb.close()
            wb = None

            for row in data:
                if row and row[0]:
                    if str(row[0]).strip().lower() == material_name.strip().lower():
                        return {
                            "material": row[0],
                            "bulk_density": row[1]
                        }

            return {
                "material": material_name,
                "bulk_density": ""
            }

        finally:
            if wb is not None:
                try:
                    wb.close()
                except:
                    pass

            if app_excel is not None:
                try:
                    app_excel.quit()
                except:
                    pass