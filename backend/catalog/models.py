import uuid
from django.conf import settings
from django.db import models


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="created_categories",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    @property
    def product_count(self):
        return self.products.count()


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    # Prix unitaire exprimé en FCFA (XAF), entier de préférence mais on garde des décimales pour flexibilité
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products",
    )
    # Vue de face OBLIGATOIRE, les 3 autres angles sont optionnels
    image_front = models.ImageField(upload_to="products/front/", blank=False, null=False)
    image_left = models.ImageField(upload_to="products/left/", blank=True, null=True)
    image_top = models.ImageField(upload_to="products/top/", blank=True, null=True)
    image_right = models.ImageField(upload_to="products/right/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        # Un produit est unique par (nom, créateur, catégorie) — règle métier
        constraints = [
            models.UniqueConstraint(
                fields=["name", "created_by", "category"],
                name="unique_product_per_owner_and_category",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.created_by})"

    @property
    def is_new(self):
        """Un produit est 'nouveau' pendant les 30 jours suivant sa création."""
        from django.utils import timezone
        return (timezone.now() - self.created_at).days < 30

    @property
    def images(self):
        """Liste des URLs d'images disponibles, dans l'ordre d'affichage."""
        result = []
        for field_name, label in [
            ("image_front", "face"), ("image_left", "gauche"),
            ("image_top", "dessus"), ("image_right", "droite"),
        ]:
            field = getattr(self, field_name)
            if field:
                result.append({"label": label, "url": field.url})
        return result