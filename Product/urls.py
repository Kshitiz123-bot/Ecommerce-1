from django.urls import path, include
from rest_framework import routers
from .views import *

router = routers.DefaultRouter()
router.register('category', CategoryViewSet, basename="CategoryViewSet")
router.register('product', ProductViewSet, basename="ProductViewSet")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("updateuser/", UpdateUser.as_view(), name="updateUser"),
    path("updateprofile/", UpdateProfile.as_view(), name="updateProfile"),
    path('send-otp/', send_otp, name='send_otp'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('reset-password/', reset_password, name='reset_password'),
]
