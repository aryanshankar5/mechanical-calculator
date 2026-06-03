from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import xlwings as xw
import os

from report_generator import (
    generate_bearing_report,
    generate_vibrating_screen_report
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

        materials = sheet.range("A2").expand("down").value

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

