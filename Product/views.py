import json

from django.http import JsonResponse
from rest_framework import views, viewsets, generics, mixins
from .models import *
from .serializers import *
from rest_framework import status
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from django.core.cache import cache
import random
import requests
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import authenticate


class ProductView(generics.GenericAPIView, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    queryset = Product.objects.all().order_by("-id")
    serializer_class = ProductSerializers
    lookup_field = "id"

    def get(self, request, id=None):
        if id:
            return self.retrieve(request)
        else:
            return self.list(request)


class RegisterView(views.APIView):
    def post(self, request):
        serializers = UserSerializer(data=request.data)
        if serializers.is_valid():
            serializers.save()
            return Response({"error": False, "message": f"user is created for '{serializers.data['username']}' ",
                             "data": serializers.data})
        return Response({"error": True, "message": serializers.errors, "status": status.HTTP_400_BAD_REQUEST})


class ProfileView(views.APIView):
    authentication_classes = [TokenAuthentication, ]
    permission_classes = [IsAuthenticated, ]

    def get(self, request):
        try:
            query = Profile.objects.get(user=request.user)
            serializer = ProfileSerializers(query)
            response_message = {"error": False, "data": serializer.data}
        except Exception as e:
            print(e)
            response_message = {"error": True, "message": "Something went Wrong"}
        return Response(response_message)


class CategoryViewSet(viewsets.ViewSet):
    def list(self, request):
        query = Category.objects.all()
        serializer = CategorySerializer(query, many=True)
        data = serializer.data
        return Response(data)

    def retrieve(self, request, pk=None):
        try:
            query = Category.objects.get(id=pk)
            serializer = CategorySerializer(query)
            data = serializer.data
            
            # Get products for this category
            category_products = Product.objects.filter(category_id=pk)
            product_serializer = ProductSerializers(category_products, many=True)
            data['category_products'] = product_serializer.data
            
            return Response(data)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
    def create(self, request):
        try:
            serializer = CategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating category: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, pk=None):
        try:
            category = Category.objects.get(id=pk)
            serializer = CategorySerializer(category, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error updating category: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        try:
            category = Category.objects.get(id=pk)
            # Check if this category has associated products
            if Product.objects.filter(category=category).exists():
                return Response({"error": "Cannot delete category with associated products"}, 
                                status=status.HTTP_400_BAD_REQUEST)
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error deleting category: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateUser(views.APIView):
    permission_classes = [IsAuthenticated, ]
    authentication_classes = [TokenAuthentication, ]

    def post(self, request):
        try:
            user = request.user
            data = request.data
            user_obj = User.objects.get(username=user)
            user_obj.first_name = data["first_name"]
            user_obj.last_name = data["last_name"]
            user_obj.email = data["email"]
            user_obj.save()
            response_data = {"error": False, "message": "User Data is Updated"}
        except Exception as e:
            print(e)
            response_data = {"error": True, "message": "User Data is not Update Try Again!!!"}
        return Response(response_data)


class UpdateProfile(views.APIView):
    permission_classes = [IsAuthenticated, ]
    authentication_classes = [TokenAuthentication, ]

    def post(self, request):
        try:
            user = request.user
            query = Profile.objects.get(user=user)
            data = request.data
            serializers = ProfileSerializers(query, data=data, context={"request": request})
            serializers.is_valid(raise_exception=True)
            serializers.save()
            return_res = {"message": "Profile is Updated"}
        except Exception as e:
            print(e)
            return_res = {"message": "Something went Wrong Try Again!!!"}
        return Response(return_res)


@api_view(['POST'])
@permission_classes([])
def send_otp(request):
    phone_number = request.data.get('phone_number')
    
    print("\n=====================================")
    print("📱 OTP Request Received")
    print("-------------------------------------")
    print(f"Phone Number: {phone_number}")
    
    if not phone_number:
        print("❌ Error: Phone number is missing")
        print("=====================================\n")
        return Response({
            "success": False,
            "message": "Phone number is required"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Normalize phone number (remove spaces and dashes)
    phone_number = ''.join(filter(str.isdigit, phone_number))
    
    if len(phone_number) != 10:
        print("❌ Error: Invalid phone number length")
        print("=====================================\n")
        return Response({
            "success": False,
            "message": "Please enter a valid 10-digit phone number"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Try to find user by phone number
        print(f"🔍 Searching for user with phone: {phone_number}")
        profile = Profile.objects.get(phone_number=phone_number)
        print(f"✅ User found: {profile.user.username}")
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        print(f"🎲 Generated OTP: {otp}")
        
        # Create OTP record
        otp_record = OTPRecord.objects.create(
            phone_number=phone_number,
            otp=otp
        )
        
        print("\n=== 🔐 OTP Authentication Details ===")
        print("-------------------------------------")
        print(f"📱 Phone Number: {phone_number}")
        print(f"🔑 OTP: {otp}")
        print(f"⏳ Expiry: 5 minutes")
        print(f"📝 Record ID: {otp_record.id}")
        print("=====================================\n")
        
        # In development mode, include OTP in response
        response_data = {
            "success": True,
            "message": "OTP sent successfully",
            "otp": otp if settings.DEBUG else None,  # Only include OTP in development
            "expiry": "5 minutes"
        }
        
        return Response(response_data)
            
    except Profile.DoesNotExist:
        print(f"❌ Error: No user found with phone number {phone_number}")
        print("=====================================\n")
        return Response({
            "success": False,
            "message": "No user found with this phone number"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Error in send_otp: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        print("=====================================\n")
        return Response({
            "success": False,
            "message": f"Failed to send OTP: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([])
def verify_otp(request):
    phone_number = request.data.get('phone_number')
    otp = request.data.get('otp')
    
    print("\n=====================================")
    print("🔍 OTP Verification Attempt:")
    print("-------------------------------------")
    
    if not phone_number or not otp:
        print("❌ Missing required fields")
        return Response({
            "success": False,
            "message": "Both phone number and OTP are required"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Normalize phone number
    phone_number = ''.join(filter(str.isdigit, phone_number))
    otp = ''.join(filter(str.isdigit, str(otp)))  # Clean OTP input
    
    print(f"📱 Phone Number: {phone_number}")
    print(f"🔑 Received OTP: {otp}")
    
    try:
        # Get all unverified OTPs for this phone number
        otp_records = OTPRecord.objects.filter(
            phone_number=phone_number,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        
        if not otp_records.exists():
            print("❌ No valid OTP records found")
            return Response({
                "success": False,
                "message": "OTP has expired or is invalid"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the latest OTP record
        otp_record = otp_records.first()
        print(f"💾 Latest OTP Record ID: {otp_record.id}")
        print(f"💾 Stored OTP: {otp_record.otp}")
        print(f"⏳ Expires at: {otp_record.expires_at}")
        
        if str(otp) == str(otp_record.otp):
            # Mark OTP as verified
            otp_record.is_verified = True
            otp_record.verified_at = timezone.now()
            otp_record.save()
            
            # Mark all other OTPs for this phone number as verified to prevent reuse
            otp_records.exclude(id=otp_record.id).update(
                is_verified=True,
                verified_at=timezone.now()
            )
            
            print("✅ OTP Verified Successfully!")
            return Response({
                "success": True,
                "message": "OTP verified successfully"
            })
        else:
            print(f"❌ Invalid OTP! Expected {otp_record.otp}, got {otp}")
            return Response({
                "success": False,
                "message": "Invalid OTP"
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ Error in verify_otp: {str(e)}")
        return Response({
            "success": False,
            "message": "Failed to verify OTP"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        print("=====================================\n")

@api_view(['POST'])
@permission_classes([])
def reset_password(request):
    phone_number = request.data.get('phone_number')
    new_password = request.data.get('new_password')
    otp = request.data.get('otp')
    
    print("\n=====================================")
    print("🔄 Password Reset Request:")
    print("-------------------------------------")
    print(f"📱 Phone Number: {phone_number}")
    print(f"🔑 Password Length: {len(new_password) if new_password else 0}")
    print(f"🔑 OTP: {otp}")
    
    if not all([phone_number, new_password, otp]):
        print("❌ Error: Missing required fields")
        return Response({
            "success": False,
            "message": "Phone number, new password and OTP are required"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        print("❌ Error: Password too short")
        return Response({
            "success": False,
            "message": "Password must be at least 8 characters long"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Normalize phone number
    phone_number = ''.join(filter(str.isdigit, phone_number))
    if len(phone_number) >= 10:
        phone_number = phone_number[-10:]
    
    try:
        # Find the user profile
        try:
            profile = Profile.objects.get(phone_number=phone_number)
            user = profile.user
            print(f"✅ Found user: {user.username}")
        except Profile.DoesNotExist:
            print("❌ Profile not found!")
            return Response({
                "success": False,
                "message": "User not found with this phone number"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify OTP
        otp_record = OTPRecord.objects.filter(
            phone_number=phone_number,
            otp=otp,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()
        
        if not otp_record:
            print("❌ No valid OTP record found")
            return Response({
                "success": False,
                "message": "Invalid or expired OTP"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"✅ OTP verified: {otp_record.otp}")
        
        # Set the new password
        print(f"🔄 Setting new password for user: {user.username}")
        user.set_password(new_password)
        user.save()
        
        # Verify the new password
        auth_test = authenticate(username=user.username, password=new_password)
        if auth_test is None:
            print("❌ Failed to verify new password!")
            return Response({
                "success": False,
                "message": "Failed to set new password"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Mark OTP as verified
        otp_record.is_verified = True
        otp_record.verified_at = timezone.now()
        otp_record.save()
        
        print("✅ Password reset successful!")
        print(f"✅ User can now login with:")
        print(f"   - Username: {user.username}")
        print(f"   - Phone: {phone_number}")
        print("=====================================\n")
        
        return Response({
            "success": True,
            "message": "Password reset successful. Please login with your new password.",
            "username": user.username,
            "phone_number": phone_number
        })
        
    except Exception as e:
        print(f"❌ Error in reset_password: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        print(f"❌ Error details: {str(e)}")
        print("=====================================\n")
        return Response({
            "success": False,
            "message": f"Failed to reset password: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([])
def login_view(request):
    login_id = request.data.get('login_id')
    password = request.data.get('password')
    
    print("\n=====================================")
    print("🔐 Login Attempt:")
    print("-------------------------------------")
    print(f"Login ID (raw): {login_id}")
    print(f"Password length: {len(password) if password else 0}")
    
    if not login_id or not password:
        print("❌ Missing credentials")
        return Response(
            {"error": "Both login ID and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # First try direct username authentication
        print(f"🔍 Attempting direct login with username: {login_id}")
        user = authenticate(username=login_id, password=password)
        
        if user:
            print(f"✅ Direct authentication successful for user: {user.username}")
        else:
            print("ℹ️ Direct authentication failed, trying phone number...")
            # Try phone number lookup
            try:
                # Remove any non-digit characters from phone number
                normalized_phone = ''.join(filter(str.isdigit, login_id))
                print(f"📱 Normalized phone input: {normalized_phone}")
                
                # Make sure we're using the last 10 digits if there are more
                if len(normalized_phone) >= 10:
                    normalized_phone = normalized_phone[-10:]
                    print(f"📱 Using last 10 digits: {normalized_phone}")
                
                    try:
                        # Look up profile by phone number
                        profile = Profile.objects.get(phone_number=normalized_phone)
                        username = profile.user.username
                        print(f"✅ Found user by phone: {username}")
                        
                        # Now authenticate with username and password
                        user = authenticate(username=username, password=password)
                        
                        if not user:
                            print("❌ Invalid password for phone number login")
                            return Response(
                                {"error": "Username/Phone number OR Password is invalid. Try Again!"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    except Profile.DoesNotExist:
                        print("❌ No user found with phone number: " + normalized_phone)
                        return Response(
                            {"error": "Username/Phone number OR Password is invalid. Try Again!"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    print("❌ Phone number too short: " + normalized_phone)
                    return Response(
                        {"error": "Username/Phone number OR Password is invalid. Try Again!"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as phone_error:
                print(f"❌ Error during phone lookup: {str(phone_error)}")
                return Response(
                    {"error": "Username/Phone number OR Password is invalid. Try Again!"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not user:
            print("❌ Authentication failed for both username and phone number")
            return Response(
                {"error": "Username/Phone number OR Password is invalid. Try Again!"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # At this point, we have a valid authenticated user
        token, _ = Token.objects.get_or_create(user=user)
        
        # Get user profile
        try:
            profile = Profile.objects.get(user=user)
            phone = profile.phone_number
        except Profile.DoesNotExist:
            phone = None
        
        print("✅ Login successful!")
        print(f"✅ User: {user.username}")
        print(f"✅ Token: {token.key[:10]}...")
        print("=====================================\n")
        
        return Response({
            "token": token.key,
            "username": user.username,
            "phone": phone
        })
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        print(f"❌ Error details: {str(e)}")
        print("=====================================\n")
        return Response(
            {"error": "Login failed. Please try again."},
            status=status.HTTP_400_BAD_REQUEST
        )

class ProductViewSet(viewsets.ViewSet):
    # Default authentication and permissions
    authentication_classes = [TokenAuthentication, ]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = []
        return [permission() for permission in permission_classes]
    
    def list(self, request):
        queryset = Product.objects.all().order_by("-id")
        # Get search term (optional)
        search_term = request.GET.get('search', '')
        if search_term:
            queryset = queryset.filter(title__icontains=search_term)
            
        # Basic implementation without pagination
        serializer = ProductSerializers(queryset, many=True)
        data = {
            'results': serializer.data,
            'count': len(serializer.data),
            'page': 1,
            'page_size': len(serializer.data),
            'total_pages': 1
        }
        return Response(data)
    
    def retrieve(self, request, pk=None):
        try:
            product = Product.objects.get(id=pk)
            serializer = ProductSerializers(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {"success": False, "message": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request):
        try:
            data = request.data.copy()
            
            # Handle category ID from form data
            if 'category' in data and data['category']:
                try:
                    category_id = int(data['category'])
                    data['category_id'] = category_id
                except (ValueError, TypeError):
                    pass
            
            serializer = ProductSerializers(data=data)
            if serializer.is_valid():
                product = serializer.save()
                return Response(
                    {"success": True, "message": "Product created successfully", "data": ProductSerializers(product).data},
                    status=status.HTTP_201_CREATED
                )
            print(f"Validation errors: {serializer.errors}")
            return Response(
                {"success": False, "message": "Validation error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Error creating product: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"success": False, "message": f"Error creating product: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        try:
            product = Product.objects.get(id=pk)
            data = request.data.copy()
            
            # Handle category ID from form data
            if 'category' in data and data['category']:
                try:
                    category_id = int(data['category'])
                    data['category_id'] = category_id
                except (ValueError, TypeError):
                    pass
            
            serializer = ProductSerializers(product, data=data, partial=True)
            if serializer.is_valid():
                updated_product = serializer.save()
                return Response(
                    {"success": True, "message": "Product updated successfully", "data": ProductSerializers(updated_product).data},
                    status=status.HTTP_200_OK
                )
            print(f"Validation errors: {serializer.errors}")
            return Response(
                {"success": False, "message": "Validation error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Product.DoesNotExist:
            return Response(
                {"success": False, "message": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error updating product: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"success": False, "message": f"Error updating product: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, pk=None):
        try:
            product = Product.objects.get(id=pk)
            product.delete()
            return Response(
                {"success": True, "message": "Product deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Product.DoesNotExist:
            return Response(
                {"success": False, "message": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Error deleting product: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
