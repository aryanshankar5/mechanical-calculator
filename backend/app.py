from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import xlwings as xw
import os

from report_generator import generate_bearing_report
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