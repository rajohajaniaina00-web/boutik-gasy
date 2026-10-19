from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Category.objects.filter(is_active=True)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category__slug", "is_featured"]
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["price", "name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            category__is_active=True,
        )
