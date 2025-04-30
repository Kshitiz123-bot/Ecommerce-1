from django.contrib import admin
from .models import *


class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "selling_price", "date")


admin.site.register(Product, ProductAdmin)


class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", 'title', 'date')


admin.site.register(Category, CategoryAdmin)


@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'otp', 'created_at', 'expires_at', 'is_verified', 'verified_at', 'is_expired')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('phone_number', 'otp')
    readonly_fields = ('created_at', 'expires_at', 'is_expired')
    ordering = ('-created_at',)

    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
    is_expired.short_description = 'Expired'


