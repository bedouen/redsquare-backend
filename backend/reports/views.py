# reports/views.py
import io
from django.db.models import Sum, F, Count
from django.db.models.functions import TruncDate
from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime

from accounts.permissions import IsAdminOrSuperAdmin, IsSuperAdmin
from orders.models import OrderItem, Order
from catalog.models import Product, Category


def _scope_order_items(request):
    """
    Retourne le queryset d'OrderItem borné au bon périmètre :
    - Admin : uniquement les articles de ses propres produits.
    - Super-Admin : tout, avec filtre optionnel ?seller=<user_id> (vue déléguée).
    """
    qs = OrderItem.objects.select_related("product", "order", "order__user")
    if request.user.is_super_admin:
        seller_id = request.query_params.get("seller")
        if seller_id:
            qs = qs.filter(product__created_by_id=seller_id)
    else:
        qs = qs.filter(product__created_by=request.user)

    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")
    if date_from:
        qs = qs.filter(order__created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(order__created_at__date__lte=date_to)
    return qs


class SalesDashboardView(APIView):
    """Statistiques de ventes globales (cartes chiffres-clés)."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        qs = _scope_order_items(request)

        per_product = (
            qs.values("product__id", "product__name")
            .annotate(
                total_quantity=Sum("quantity"),
                total_revenue=Sum(F("quantity") * F("unit_price")),
            )
            .order_by("-total_revenue")
        )

        totals = qs.aggregate(
            total_revenue=Sum(F("quantity") * F("unit_price")),
            total_items_sold=Sum("quantity"),
        )

        buyers_count = qs.values("order__user").distinct().count()
        total_orders = qs.values("order").distinct().count()

        return Response({
            "totals": {
                "total_revenue": float(totals["total_revenue"] or 0),
                "total_items_sold": totals["total_items_sold"] or 0,
                "distinct_buyers": buyers_count,
            },
            "total_orders": total_orders,
            "per_product": list(per_product),
        })


# ✅ NOUVEAU : Vue pour les détails des acheteurs
class SalesDetailView(APIView):
    """
    Détail ligne par ligne : client, produit acheté, date, quantité, montant,
    et localisation de livraison — utilisé par le tableau du dashboard admin.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        qs = _scope_order_items(request)
        rows = []
        for item in qs.order_by("-order__created_at"):
            order = item.order
            rows.append({
                "id": str(item.id),
                "order_id": str(order.id),
                "buyer_name": f"{order.user.first_name} {order.user.last_name or ''}".strip(),
                "buyer_phone": order.user.phone_number,
                "buyer_email": order.user.email or '',
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total": float(item.quantity * item.unit_price),
                "date": order.created_at.strftime("%d/%m/%Y"),
                "time": order.created_at.strftime("%H:%M"),
                "delivery_city": order.delivery_city or "Retrait en magasin",
                "delivery_neighborhood": order.delivery_neighborhood or "-",
                "payment_method": order.payment_method,
                "transaction_id": order.transaction_id or '',
                "status": order.status,
            })
        return Response(rows)


class GlobalOverviewView(APIView):
    """Vue d'ensemble globale — réservée au Super-Admin."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_super_admin:
            return Response({"detail": "Action non autorisée."}, status=403)

        from accounts.models import User

        return Response({
            "total_users": User.objects.count(),
            "total_clients": User.objects.filter(role=User.Role.CLIENT).count(),
            "total_admins": User.objects.filter(role=User.Role.ADMIN).count(),
            "total_products": Product.objects.count(),
            "total_orders": Order.objects.filter(status="paid").count(),
            "total_revenue": Order.objects.filter(status="paid").aggregate(
                total=Sum("total_amount")
            )["total"] or 0,
        })


class ChartsDataView(APIView):
    """Données pour les graphiques."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        qs = _scope_order_items(request)

        by_day = (
            qs.annotate(day=TruncDate("order__created_at"))
            .values("day")
            .annotate(revenue=Sum(F("quantity") * F("unit_price")), items=Sum("quantity"))
            .order_by("day")
        )

        top_products = (
            qs.values("product__name")
            .annotate(revenue=Sum(F("quantity") * F("unit_price")))
            .order_by("-revenue")[:8]
        )

        by_category = (
            qs.values("product__category__name")
            .annotate(revenue=Sum(F("quantity") * F("unit_price")))
            .order_by("-revenue")
        )

        return Response({
            "evolution": [
                {"date": str(row["day"]), "revenue": float(row["revenue"] or 0), "items": row["items"] or 0}
                for row in by_day
            ],
            "top_products": [
                {"name": row["product__name"], "revenue": float(row["revenue"] or 0)}
                for row in top_products
            ],
            "by_category": [
                {"name": row["product__category__name"] or "Sans catégorie", "revenue": float(row["revenue"] or 0)}
                for row in by_category
            ],
            "total_revenue": qs.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"] or 0,
            "total_orders": qs.values("order").distinct().count(),
            "total_items_sold": qs.aggregate(total=Sum("quantity"))["total"] or 0,
            "distinct_buyers": qs.values("order__user").distinct().count(),
        })


# ─── FONCTIONS UTILITAIRES POUR LES PDF ───

def _pdf_header(elements, styles, title, subtitle=""):
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#E63946"),
        alignment=TA_CENTER,
        spaceAfter=10
    )
    elements.append(Paragraph(title, title_style))
    if subtitle:
        elements.append(Paragraph(subtitle, styles["Normal"]))
    elements.append(Spacer(1, 0.5 * cm))


def _styled_table(data, col_widths=None):
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A1A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F7F7")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


class SalesReportPDFView(APIView):
    """Rapport de ventes structuré en tableau."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        qs = _scope_order_items(request)
        date_from = request.query_params.get("date_from") or "début"
        date_to = request.query_params.get("date_to") or "aujourd'hui"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=1.5 * cm, bottomMargin=1.5 * cm)
        styles = getSampleStyleSheet()
        elements = []

        _pdf_header(
            elements, styles, "RedSquare — Rapport de ventes",
            f"Période : {date_from} au {date_to}",
        )

        header = ["Produit", "Client", "Qté", "P.U (FCFA)", "Total (FCFA)", "Date", "Localisation"]
        data = [header]
        for item in qs.order_by("-order__created_at")[:200]:
            order = item.order
            data.append([
                item.product.name[:28],
                f"{order.user.first_name}"[:18],
                str(item.quantity),
                f"{float(item.unit_price):,.0f}",
                f"{float(item.quantity * item.unit_price):,.0f}",
                order.created_at.strftime("%d/%m/%Y"),
                (order.delivery_city or "Retrait")[:16],
            ])

        elements.append(_styled_table(data, col_widths=[3.4 * cm, 2.4 * cm, 1 * cm, 2.1 * cm, 2.3 * cm, 2 * cm, 2.6 * cm]))
        elements.append(Spacer(1, 0.6 * cm))

        # Récapitulatif par produit
        summary = (
            qs.values("product__name")
            .annotate(total_quantity=Sum("quantity"), total_revenue=Sum(F("quantity") * F("unit_price")))
            .order_by("-total_revenue")
        )
        elements.append(Paragraph("Récapitulatif par produit", styles["Heading2"]))
        summary_data = [["Produit", "Quantité vendue", "Chiffre d'affaires (FCFA)"]]
        for row in summary[:20]:
            summary_data.append([row["product__name"], str(row["total_quantity"]), f"{float(row['total_revenue']):,.0f}"])
        elements.append(_styled_table(summary_data, col_widths=[8 * cm, 4 * cm, 5 * cm]))

        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename="rapport_ventes.pdf")


class ExportTableView(APIView):
    """Exporte un tableau de données en PDF."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        title = request.data.get('title', 'Export de données')
        headers = request.data.get('headers', [])
        data = request.data.get('data', [])

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=1*cm,
            bottomMargin=1*cm
        )

        styles = getSampleStyleSheet()
        story = []

        _pdf_header(elements=story, styles=styles, title=title, subtitle=f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}")

        if headers and data:
            table_data = [headers]
            for item in data:
                row = []
                for header in headers:
                    value = item.get(header, '')
                    if isinstance(value, (int, float)):
                        value = str(value)
                    elif value is None:
                        value = ''
                    row.append(str(value))
                table_data.append(row)

            table = Table(table_data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E63946")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(table)

        doc.build(story)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )


class ExportSectionView(APIView):
    """Exporte une section spécifique en PDF."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        section = request.data.get('section', 'export')
        data = request.data.get('data', [])
        date_from = request.data.get('date_from', '')
        date_to = request.data.get('date_to', '')

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=1*cm,
            bottomMargin=1*cm
        )

        styles = getSampleStyleSheet()
        story = []

        period_text = f"Période : {date_from or 'Début'} au {date_to or 'Aujourd\'hui'}"
        _pdf_header(elements=story, styles=styles, title=f"Rapport - {section.upper()}", subtitle=period_text)

        if data:
            headers = list(data[0].keys()) if data else []
            table_data = [headers]
            for item in data:
                row = [str(v) if v is not None else '' for v in item.values()]
                table_data.append(row)

            table = Table(table_data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E63946")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(table)

        doc.build(story)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'{section}_{datetime.now().strftime("%Y%m%d")}.pdf'
        )


class ExportChartsView(APIView):
    """Exporte les graphiques en PDF."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        charts_data = request.data.get('charts', {})
        period = request.data.get('period', 'month')

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm
        )

        styles = getSampleStyleSheet()
        story = []

        _pdf_header(
            elements=story, 
            styles=styles, 
            title="Graphiques de ventes", 
            subtitle=f"Période: {period} - {datetime.now().strftime('%d/%m/%Y')}"
        )

        sales = charts_data.get('sales', {})
        if sales:
            story.append(Paragraph("Résumé des ventes", styles['Heading2']))
            story.append(Spacer(1, 0.3*cm))

            summary_data = [
                ['Indicateur', 'Valeur'],
                ['Chiffre d\'affaires', f"{float(sales.get('total_revenue', 0)):,.0f} FCFA"],
                ['Nombre de commandes', str(sales.get('total_orders', 0))],
                ['Articles vendus', str(sales.get('total_items_sold', 0))],
                ['Clients uniques', str(sales.get('distinct_buyers', 0))],
            ]
            table = Table(summary_data, colWidths=[6*cm, 8*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E63946")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(table)

        doc.build(story)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'graphiques_{datetime.now().strftime("%Y%m%d")}.pdf'
        )