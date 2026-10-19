from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import Order, OrderItem


class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user).prefetch_related("items")
        data = []

        for order in orders:
            data.append({
                "id": order.id,
                "full_name": order.full_name,
                "phone": order.phone,
                "address": order.address,
                "notes": order.notes,
                "status": order.status,
                "total": order.total,
                "created_at": order.created_at,
                "items": [
                    {
                        "product_name": item.product_name,
                        "unit_price": item.unit_price,
                        "quantity": item.quantity,
                        "subtotal": item.subtotal,
                    }
                    for item in order.items.all()
                ],
            })

        return Response(data)

    @transaction.atomic
    def post(self, request):
        full_name = str(request.data.get("full_name", "")).strip()
        phone = str(request.data.get("phone", "")).strip()
        address = str(request.data.get("address", "")).strip()
        notes = str(request.data.get("notes", "")).strip()
        items = request.data.get("items")

        if not full_name or not phone or not address:
            return Response(
                {"detail": "Nom complet, téléphone et adresse sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(items, list) or not items:
            return Response(
                {"detail": "Le panier est vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quantities = {}
        for item in items:
            if not isinstance(item, dict):
                return Response(
                    {"detail": "Format d'article invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                product_id = int(item.get("product_id"))
                quantity = int(item.get("quantity"))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Produit ou quantité invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if product_id <= 0 or quantity <= 0:
                return Response(
                    {"detail": "Les quantités doivent être positives."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            quantities[product_id] = quantities.get(product_id, 0) + quantity

        order = Order.objects.create(
            customer=request.user,
            full_name=full_name,
            phone=phone,
            address=address,
            notes=notes,
        )

        total = 0

        for product_id, quantity in quantities.items():
            try:
                product = Product.objects.select_for_update().get(
                    pk=product_id,
                    is_active=True,
                )
            except Product.DoesNotExist:
                return Response(
                    {"detail": f"Le produit #{product_id} n'est pas disponible."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if product.stock < quantity:
                return Response(
                    {
                        "detail": f"Stock insuffisant pour « {product.name} ».",
                        "stock_disponible": product.stock,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            unit_price = product.price
            subtotal = unit_price * quantity
            total += subtotal

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                unit_price=unit_price,
                quantity=quantity,
                subtotal=subtotal,
            )

            product.stock -= quantity
            product.save(update_fields=["stock"])

        order.total = total
        order.save(update_fields=["total", "updated_at"])

        return Response(
            {
                "message": "Commande créée avec succès.",
                "order": {
                    "id": order.id,
                    "status": order.status,
                    "total": order.total,
                    "created_at": order.created_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )
