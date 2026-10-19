from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        source="category",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "stock",
            "image",
            "is_featured",
            "category",
            "category_id",
            "created_at",
        ]
