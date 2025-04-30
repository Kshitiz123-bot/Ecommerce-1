from django.conf import settings
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_payment_session(request):
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=request.data.get('items', []),
            mode='payment',
            success_url=request.build_absolute_uri('/oldOrders'),
            cancel_url=request.build_absolute_uri('/cart'),
        )
        
        return Response({'sessionId': checkout_session.id})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            # Update order payment status
            from .models import Order
            order = Order.objects.get(cart__id=session['client_reference_id'])
            order.payment_complete = True
            order.save()

        return Response({'status': 'success'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)