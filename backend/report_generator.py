from docx import Document
from docx2pdf import convert
import os


def replace_placeholders(doc, replacements):

    # Paragraphs
    for paragraph in doc.paragraphs:

        full_text = paragraph.text

        for key, value in replacements.items():
            full_text = full_text.replace(
                "{{" + key + "}}",
                str(value)
            )

        if paragraph.runs:
            paragraph.runs[0].text = full_text

            for run in paragraph.runs[1:]:
                run.text = ""

    # Tables
    for table in doc.tables:

        for row in table.rows:

            for cell in row.cells:

                for paragraph in cell.paragraphs:

                    full_text = paragraph.text

                    for key, value in replacements.items():
                        full_text = full_text.replace(
                            "{{" + key + "}}",
                            str(value)
                        )

                    if paragraph.runs:
                        paragraph.runs[0].text = full_text

                        for run in paragraph.runs[1:]:
                            run.text = ""
                                

def generate_bearing_report(data):

    template_path = os.path.join(
        os.getcwd(),
        "templates",
        "Bearing Report.docx"
    )

    output_docx = os.path.join(
        os.getcwd(),
        "reports",
        "bearing_report.docx"
    )

    output_pdf = os.path.join(
        os.getcwd(),
        "reports",
        "bearing_report.pdf"
    )

    doc = Document(template_path)

    print("REPORT DATA")
    for k, v in data.items():
        print(k, "=", v)

    replace_placeholders(
        doc,
        data
    )

    doc.save(output_docx)

    convert(output_docx, output_pdf)

    return output_pdf

def generate_vibrating_screen_report(data):

    template_path = os.path.join(
        os.getcwd(),
        "templates",
        "Vibrating Screen Report.docx"
    )

    output_docx = os.path.join(
        os.getcwd(),
        "reports",
        "vibrating_screen_report.docx"
    )

    output_pdf = os.path.join(
        os.getcwd(),
        "reports",
        "vibrating_screen_report.pdf"
    )

    doc = Document(template_path)

    replace_placeholders(doc, data)

    doc.save(output_docx)

    convert(output_docx, output_pdf)

    return output_pdf