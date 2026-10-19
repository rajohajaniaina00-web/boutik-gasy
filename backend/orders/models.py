from django.conf import settings
from django.db import models
from products.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        CONFIRMED = "confirmed", "Confirmée"
        PREPARING = "preparing", "En préparation"
        SHIPPED = "shipped", "Expédiée"
        DELIVERED = "delivered", "Livrée"
        CANCELLED = "cancelled", "Annulée"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    address = models.TextField()
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    total = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"

    def __str__(self):
        return f"Commande #{self.pk} - {self.full_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    product_name = models.CharField(max_length=200)
    unit_price = models.PositiveBigIntegerField()
    quantity = models.PositiveIntegerField()
    subtotal = models.PositiveBigIntegerField()

    class Meta:
        verbose_name = "Article commandé"
        verbose_name_plural = "Articles commandés"

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"
