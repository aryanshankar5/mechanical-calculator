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
    "bulk_density": ("POWER", "B9"),
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
    "design_capacity": ("POWER", "B6"),

    "mass_handled_material": ("POWER", "B61"),
    "effective_tension": ("POWER", "B156"),

    "motor_power": ("POWER", "B140"),
    "gearbox_kw": ("POWER", "B173"),
    "gearbox_reduction_ratio": ("POWER", "B176"),

    "high_speed_coupling": ("POWER", "B182"),
    "low_speed_coupling": ("POWER", "B187"),

    "braking_torque": ("POWER", "B191"),
    "pulley_shaft_diameter": ("POWER", "B208"),

    "carcass_thickness": ("POWER", "B56"),
    "drive_pulley_diameter": ("POWER", "B167"),
    "snub_pulley_diameter": ("POWER", "B168"),
    "tail_pulley_diameter": ("POWER", "B169"),
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

    app_excel = xw.App(visible=False)

    try:
        wb = app_excel.books.open(excel_path)

        for key, item in CONVEYOR_INPUT_CELLS.items():
            sheet_name, cell = item
            wb.sheets[sheet_name].range(cell).value = getattr(data, key)

        wb.app.calculate()

        results = {}

        for key, item in CONVEYOR_OUTPUT_CELLS.items():
            sheet_name, cell = item
            results[key] = wb.sheets[sheet_name].range(cell).value

        wb.close()
        return results

    finally:
        app_excel.quit()

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

        except Exception as e:
            print("DESIGN CAPACITY ERROR:", str(e))
            return {
                "design_capacity": "",
                "error": str(e)
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

