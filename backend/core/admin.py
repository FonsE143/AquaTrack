from django.contrib import admin
from django import forms
from core.models import *

# Custom form for Route to handle multiple barangays from multiple municipalities
class RouteForm(forms.ModelForm):
    class Meta:
        model = Route
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If we have municipalities selected, filter barangays by those municipalities
        if 'municipalities' in self.data:
            try:
                municipality_ids = [int(mid) for mid in self.data.getlist('municipalities')]
                self.fields['barangays'].queryset = Barangay.objects.filter(municipality_id__in=municipality_ids)
            except (ValueError, TypeError):
                self.fields['barangays'].queryset = Barangay.objects.none()
        elif self.instance.pk and self.instance.municipalities.exists():
            municipality_ids = list(self.instance.municipalities.values_list('id', flat=True))
            self.fields['barangays'].queryset = Barangay.objects.filter(municipality_id__in=municipality_ids)
        else:
            self.fields['barangays'].queryset = Barangay.objects.all()

# Custom admin for Route
class RouteAdmin(admin.ModelAdmin):
    form = RouteForm
    list_display = ('route_number', 'get_municipalities', 'get_barangays')
    
    def get_municipalities(self, obj):
        return ", ".join([m.name for m in obj.municipalities.all()])
    get_municipalities.short_description = 'Municipalities'
    
    def get_barangays(self, obj):
        return ", ".join([b.name for b in obj.barangays.all()])
    get_barangays.short_description = 'Barangays'

# Custom form for Deployment to validate stock
class DeploymentForm(forms.ModelForm):
    class Meta:
        model = Deployment
        fields = '__all__'
    
    def clean_stock(self):
        stock = self.cleaned_data['stock']
        vehicle = self.cleaned_data.get('vehicle')
        
        if vehicle and stock > vehicle.stock_limit:
            raise forms.ValidationError('Stock exceeds vehicle limit!')
        
        return stock

# Custom admin for Deployment
class DeploymentAdmin(admin.ModelAdmin):
    form = DeploymentForm
    list_display = ('driver', 'vehicle', 'route', 'stock', 'created_at')
    list_filter = ('driver', 'vehicle', 'route', 'created_at')

# Custom admin for User
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

# Custom admin for Profile
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'first_name', 'last_name', 'phone')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email', 'first_name', 'last_name', 'phone')

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(Delivery)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Notification)
admin.site.register(OrderHistory)
admin.site.register(CancelledOrder)
admin.site.register(ActivityLog)
admin.site.register(Municipality)
admin.site.register(Barangay)
admin.site.register(Address)
admin.site.register(WalkInOrder)
admin.site.register(Route, RouteAdmin)
admin.site.register(Vehicle)
admin.site.register(Deployment, DeploymentAdmin)
