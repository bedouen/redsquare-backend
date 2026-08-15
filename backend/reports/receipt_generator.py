import os
from io import BytesIO
from datetime import datetime
from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def generate_receipt(order, transaction, is_reservation=False):
    """
    Génère un reçu PDF pour une commande (paiement ou réservation)
    Optimisé pour tenir sur une seule page A4
    
    Args:
        order: L'objet Order
        transaction: L'objet PaymentTransaction (peut être None)
        is_reservation: Booléen indiquant si c'est une réservation
    
    Returns:
        str: Le chemin du fichier PDF sauvegardé
    """
    buffer = BytesIO()
    
    # Marges réduites pour optimiser l'espace
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )

    styles = getSampleStyleSheet()
    
    # ─── STYLES PERSONNALISÉS ───
    # En-tête
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    
    # Titre RedSquare
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#E63946"),
        alignment=TA_CENTER,
        spaceAfter=2
    )
    
    # Sous-titre
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1A1A1A"),
        spaceAfter=5
    )
    
    # Titre du reçu
    receipt_title_style = ParagraphStyle(
        'ReceiptTitleStyle',
        parent=styles['Heading2'],
        fontSize=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1A1A1A"),
        spaceAfter=5
    )
    
    # Numéro de commande
    order_number_style = ParagraphStyle(
        'OrderNumberStyle',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=10,
        textColor=colors.HexColor("#E63946"),
        spaceAfter=5
    )
    
    # Section titre
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading4'],
        fontSize=9,
        textColor=colors.HexColor("#1A1A1A"),
        spaceAfter=3,
        alignment=TA_LEFT
    )
    
    # Cellule de tableau
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_LEFT
    )
    
    # Pied de page
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    
    story = []
    
    # ─── EN-TÊTE ───
    # Ligne 1: Coordonnées de l'entreprise
    header_data = [
        ["RedSquare • Douala, Cameroun • +237 654 162 939 • contact@redsquare.com • www.redsquare.com"]
    ]
    header_table = Table(header_data, colWidths=[17*cm])
    header_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.2*cm))
    
    # ─── TITRE ───
    story.append(Paragraph("RedSquare", title_style))
    story.append(Paragraph("Marketplace Multi-Vendeurs Camerounaise", subtitle_style))
    story.append(Spacer(1, 0.2*cm))
    
    # ─── TITRE DU REÇU ───
    if is_reservation:
        receipt_type = "CONFIRMATION DE RÉSERVATION"
    else:
        receipt_type = "REÇU DE PAIEMENT"
    story.append(Paragraph(receipt_type, receipt_title_style))
    
    # ─── NUMÉRO DE COMMANDE ───
    order_id_str = str(order.id)[:8].upper()
    story.append(Paragraph(f"Commande #{order_id_str}", order_number_style))
    story.append(Spacer(1, 0.2*cm))
    
    # ─── TABLEAUX JUMELÉS: CLIENT ET COMMANDE ───
    # Préparer les données
    user_data = [
        ["CLIENT"],
        [f"Nom: {order.user.first_name} {order.user.last_name or ''}".strip()],
        [f"Tél: {order.user.phone_number}"],
        [f"Email: {order.user.email or 'Non renseigné'}"],
    ]
    
    if order.user.city:
        user_data.append([f"Ville: {order.user.city}"])
    if order.user.neighborhood:
        user_data.append([f"Quartier: {order.user.neighborhood}"])
    
    # Données de la commande
    order_data = [
        ["COMMANDE"],
        [f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}"],
        [f"Type: {'Réservation' if is_reservation else 'Paiement'}"],
        [f"Statut: {'Confirmé' if is_reservation else order.get_status_display()}"],
    ]
    
    if is_reservation and order.pickup_date:
        pickup_date_str = order.pickup_date.strftime('%d/%m/%Y')
        pickup_time_str = order.pickup_time.strftime('%H:%M') if order.pickup_time else '12:00'
        order_data.append([f"Retrait: {pickup_date_str} à {pickup_time_str}"])
    
    if order.delivery_city:
        delivery_info = order.delivery_city
        if order.delivery_neighborhood:
            delivery_info += f" - {order.delivery_neighborhood}"
        order_data.append([f"Livraison: {delivery_info}"])
    
    # Créer le tableau jumelé
    # Calculer les hauteurs
    max_rows = max(len(user_data), len(order_data))
    while len(user_data) < max_rows:
        user_data.append([""])
    while len(order_data) < max_rows:
        order_data.append([""])
    
    combined_data = []
    for i in range(max_rows):
        combined_data.append([user_data[i][0], order_data[i][0]])
    
    combined_table = Table(combined_data, colWidths=[8.5*cm, 8.5*cm])
    combined_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#F7F7F7")),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#F7F7F7")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTWEIGHT', (0, 0), (0, 0), 'BOLD'),
        ('FONTWEIGHT', (1, 0), (1, 0), 'BOLD'),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor("#1A1A1A")),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor("#1A1A1A")),
    ]))
    story.append(combined_table)
    story.append(Spacer(1, 0.3*cm))
    
    # ─── ARTICLES COMMANDÉS ───
    story.append(Paragraph("ARTICLES", section_title_style))
    
    items_data = [
        ["Désignation", "Qté", "P.U", "Total"]
    ]
    
    # Correction: Gérer les produits supprimés
    for item in order.items.all():
        try:
            if hasattr(item, 'product') and item.product:
                product_name = item.product.name
            else:
                product_name = item.product_name or "Produit supprimé"
            
            unit_price = float(item.unit_price) if item.unit_price else 0
            total = unit_price * item.quantity
            
        except Exception:
            product_name = item.product_name or "Produit supprimé"
            unit_price = float(item.unit_price) if item.unit_price else 0
            total = unit_price * item.quantity
        
        items_data.append([
            product_name[:40],  # Limiter la longueur
            str(item.quantity),
            f"{unit_price:,.0f}",
            f"{total:,.0f}"
        ])
    
    # Ajuster les largeurs
    items_table = Table(items_data, colWidths=[7.5*cm, 2*cm, 3*cm, 3.5*cm])
    items_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1A1A1A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 3),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F7F7")]),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.2*cm))
    
    # ─── TOTAUX ───
    subtotal = float(order.subtotal) if order.subtotal else 0
    delivery = float(order.delivery_fee) if order.delivery_fee else 0
    total = float(order.total_amount) if order.total_amount else 0
    
    # Tableau des totaux aligné à droite
    totals_data = [
        ["Sous-total", f"{subtotal:,.0f} FCFA"],
        ["Livraison", f"{delivery:,.0f} FCFA"],
    ]
    
    if is_reservation:
        totals_data.append(["Paiement", "À effectuer lors du retrait"])
        totals_data.append(["Total à payer", "0 FCFA"])
    else:
        totals_data.append(["TOTAL", f"{total:,.0f} FCFA"])
    
    totals_table = Table(totals_data, colWidths=[10*cm, 6*cm])
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.white),
        ('PADDING', (0, 0), (-1, -1), 3),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTWEIGHT', (0, -1), (1, -1), 'BOLD'),
        ('BACKGROUND', (0, -1), (1, -1), colors.HexColor("#E63946") if not is_reservation else colors.HexColor("#F4A261")),
        ('TEXTCOLOR', (0, -1), (1, -1), colors.whitesmoke),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 0.2*cm))
    
    # ─── INFORMATIONS DE PAIEMENT (si transaction existe) ───
    if transaction:
        payment_text = f"Méthode: {transaction.get_payment_type_display() if hasattr(transaction, 'get_payment_type_display') else transaction.payment_type} | Réf: {transaction.reference or transaction.transaction_id or 'N/A'}"
        if transaction.transaction_id:
            payment_text += f" | ID: {transaction.transaction_id}"
        
        story.append(Paragraph(
            payment_text,
            ParagraphStyle(
                'PaymentInfo',
                parent=styles['Normal'],
                fontSize=7,
                textColor=colors.grey,
                alignment=TA_CENTER
            )
        ))
        story.append(Spacer(1, 0.1*cm))
    
    # ─── PIED DE PAGE ───
    story.append(Spacer(1, 0.1*cm))
    
    # Message de remerciement
    story.append(Paragraph(
        "Merci pour votre confiance !",
        ParagraphStyle(
            'ThankYouStyle',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontSize=10,
            textColor=colors.HexColor("#E63946"),
            spaceAfter=3
        )
    ))
    
    # Coordonnées RedSquare en pied
    footer_data = [
        ["RedSquare - Douala, Cameroun | Tél: +237 654 162 939 | Email: contact@redsquare.com"]
    ]
    footer_table = Table(footer_data, colWidths=[17*cm])
    footer_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 6),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 1),
    ]))
    story.append(footer_table)
    
    # Date de génération
    story.append(Paragraph(
        f"Reçu généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
        footer_style
    ))
    
    # Mention légale
    story.append(Paragraph(
        "Ce document fait foi de reçu de paiement / confirmation de réservation.",
        ParagraphStyle(
            'LegalNotice',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontSize=5,
            textColor=colors.grey
        )
    ))
    
    # ─── Générer le PDF ───
    doc.build(story)
    
    # ─── Sauvegarder le PDF avec un nom intuitif ───
    buffer.seek(0)
    
    # Nom du fichier: type_commande_numero_date.pdf
    if is_reservation:
        file_type = "reservation"
    else:
        file_type = "paiement"
    
    filename = f"{file_type}_{order_id_str}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    
    # Sauvegarder sur le serveur
    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile
    
    file_path = f"receipts/{filename}"
    saved_path = default_storage.save(file_path, ContentFile(buffer.getvalue()))
    
    return saved_path