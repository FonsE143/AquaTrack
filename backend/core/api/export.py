import csv
from django.http import HttpResponse
from core.models import Profile, Product

def export_customers(request):
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename=customers.csv'
    w = csv.writer(resp); w.writerow(['username','email','phone','address'])
    for c in Profile.objects.filter(role='customer'):
        w.writerow([c.user.username, c.user.email, c.phone, c.address])
    return resp

def export_staff(request):
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename=staff.csv'
    w = csv.writer(resp); w.writerow(['username','email','phone','address'])
    for s in Profile.objects.filter(role='staff'):
        w.writerow([s.user.username, s.user.email, s.phone, s.address])
    return resp

def export_products(request):
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename=products.csv'
    w = csv.writer(resp); w.writerow(['name','sku','price'])
    for p in Product.objects.all():
        w.writerow([p.name,p.sku,p.price])
    return resp
