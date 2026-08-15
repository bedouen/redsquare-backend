import os
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas


def generate_receipt_pdf(payment):
    """Génère un reçu PDF simple pour un paiement et retourne son chemin relatif."""
    order = payment.order
    filename = f"receipt_{payment.transaction_id}.pdf"
    directory = os.path.join(settings.MEDIA_ROOT, "receipts")
    os.makedirs(directory, exist_ok=True)
    filepath = os.path.join(directory, filename)

    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4

    c.setFillColorRGB(0.9, 0.2, 0.26)  # rouge RedSquare
    c.rect(0, height - 3 * cm, width, 3 * cm, fill=True, stroke=False)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(2 * cm, height - 2 * cm, "RedSquare - Reçu de paiement")

    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.setFont("Helvetica", 11)
    y = height - 4 * cm
    lines = [
        f"Transaction : {payment.transaction_id}",
        f"Commande : {order.id}",
        f"Client : {order.user.first_name} {order.user.last_name or ''}",
        f"Méthode de paiement : {order.get_payment_method_display()}",
        f"Sous-total : {order.subtotal} FCFA",
        f"Frais de livraison : {order.delivery_fee} FCFA",
        f"Montant total : {payment.amount} FCFA",
        f"Statut : {payment.get_status_display()}",
    ]
    if order.has_delivery_info():
        lines.append(f"Livraison : {order.delivery_city}, {order.delivery_neighborhood}")
        lines.append(f"Téléphone livraison : {order.delivery_phone}")
    else:
        lines.append("Mode : Retrait en magasin virtuel (pas de livraison)")
    for line in lines:
        c.drawString(2 * cm, y, line)
        y -= 0.8 * cm

    y -= 0.5 * cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2 * cm, y, "Articles :")
    y -= 0.8 * cm
    c.setFont("Helvetica", 10)
    for item in order.items.all():
        c.drawString(
            2 * cm, y,
            f"- {item.product.name} x{item.quantity} @ {item.unit_price} FCFA",
        )
        y -= 0.6 * cm

    c.showPage()
    c.save()

    return f"{settings.MEDIA_URL}receipts/{filename}"
