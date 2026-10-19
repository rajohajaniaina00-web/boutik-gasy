
from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "stock",
        "is_active",
        "is_featured",
    )
    list_filter = ("category", "is_active", "is_featured")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("price", "stock", "is_active", "is_featured")
    ordering = ("-created_at",)
