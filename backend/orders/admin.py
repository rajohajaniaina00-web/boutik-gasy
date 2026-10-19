from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product",
        "product_name",
        "unit_price",
        "quantity",
        "subtotal",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "phone",
        "total",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "full_name",
        "phone",
        "address",
        "customer__username",
    )
    readonly_fields = ("created_at", "updated_at")
    inlines = [OrderItemInline]
    list_per_page = 25
