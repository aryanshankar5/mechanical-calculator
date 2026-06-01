from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet


def generate_bearing_report(data, filename):

    doc = SimpleDocTemplate(filename)

    styles = getSampleStyleSheet()

    content = []

    content.append(
        Paragraph(
            "Bearing Life Calculation Report",
            styles["Title"]
        )
    )

    content.append(Spacer(1, 20))

    content.append(
        Paragraph(
            "Input Parameters",
            styles["Heading2"]
        )
    )

    for key, value in data["inputs"].items():
        content.append(
            Paragraph(
                f"{key}: {value}",
                styles["BodyText"]
            )
        )

    content.append(Spacer(1, 20))

    content.append(
        Paragraph(
            "Results",
            styles["Heading2"]
        )
    )

    for key, value in data["results"].items():
        content.append(
            Paragraph(
                f"{key}: {value}",
                styles["BodyText"]
            )
        )

    doc.build(content)