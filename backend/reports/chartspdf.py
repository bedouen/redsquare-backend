"""
Assemble un PDF unique à partir d'un ensemble de graphiques (images PNG en
base64) générés côté frontend avec Recharts + html2canvas. Le frontend
choisit les graphiques à inclure, les capture en image, et les envoie ici
pour obtenir un rapport PDF unique.
"""
import base64
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse

from accounts.permissions import IsAdminOrSuperAdmin


class ChartsPDFExportView(APIView):
    """
    POST { "charts": [ { "title": "...", "image": "data:image/png;base64,..." }, ... ] }
    → renvoie un PDF contenant chaque graphique sur sa propre page/section.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def post(self, request):
        charts = request.data.get("charts", [])
        if not charts:
            return Response({"detail": "Aucun graphique fourni."}, status=400)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
        styles = getSampleStyleSheet()
        elements = []

        title_style = styles["Title"]
        title_style.textColor = colors.HexColor("#E63946")
        elements.append(Paragraph("RedSquare — Rapport graphique des ventes", title_style))
        elements.append(Spacer(1, 0.5 * cm))

        for chart in charts:
            title = chart.get("title", "Graphique")
            image_data = chart.get("image", "")
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]
            try:
                img_bytes = base64.b64decode(image_data)
            except Exception:
                continue

            elements.append(Paragraph(title, styles["Heading2"]))
            img_buffer = io.BytesIO(img_bytes)
            elements.append(RLImage(img_buffer, width=16 * cm, height=9 * cm))
            elements.append(Spacer(1, 0.8 * cm))

        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename="rapport_graphiques.pdf")