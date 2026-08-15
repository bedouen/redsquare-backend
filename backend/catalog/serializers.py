from rest_framework import serializers
from .models import Category, Product
from accounts.serializers import UserBasicSerializer


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='_product_count', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'created_by', 'created_by_name', 
            'created_at', 'product_count'
        ]
        read_only_fields = ['created_by', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    created_by_phone = serializers.CharField(source='created_by.phone_number', read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'quantity', 'unit_price',
            'image_front', 'image_left', 'image_top', 'image_right',
            'category', 'category_name', 'created_by', 'created_by_name',
            'created_by_phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de produit avec validation des images.
    """
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'quantity', 'unit_price',
            'image_front', 'image_left', 'image_top', 'image_right',
            'category'
        ]
        read_only_fields = ['created_by']

    def validate_image_front(self, value):
        """Valide que l'image de face est fournie."""
        if not value:
            raise serializers.ValidationError("L'image de face est obligatoire.")
        return value

    def validate_unit_price(self, value):
        """Valide que le prix est supérieur à 0."""
        if value <= 0:
            raise serializers.ValidationError("Le prix doit être supérieur à 0.")
        return value

    def validate_quantity(self, value):
        """Valide que la quantité n'est pas négative."""
        if value < 0:
            raise serializers.ValidationError("La quantité ne peut pas être négative.")
        return value

    def validate(self, data):
        """Validation supplémentaire."""
        # Vérifier que la catégorie existe
        if 'category' not in data:
            raise serializers.ValidationError({"category": "La catégorie est obligatoire."})
        
        return data

    def create(self, validated_data):
        """Crée le produit avec l'utilisateur actuel."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Met à jour le produit."""
        # Le created_by ne doit pas être modifiable
        validated_data.pop('created_by', None)
        return super().update(instance, validated_data)


class ProductStatisticsSerializer(serializers.Serializer):
    """Serializer pour les statistiques des produits."""
    total_products = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    avg_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    in_stock_count = serializers.IntegerField()
    out_of_stock_count = serializers.IntegerField()
    categories_stats = serializers.ListField()
    most_expensive = ProductSerializer(many=True)