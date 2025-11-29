# Script to add by_customer_barangay endpoint to DeploymentViewSet

file_path = r'backend\core\api\views.py'

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Add the new method before the last line (before the class ends)
new_method = '''
    @action(detail=False, methods=['get'], url_path='by-customer-barangay')
    def by_customer_barangay(self, request):
        """Get deployments for the current customer's barangay"""
        if not hasattr(request.user, 'profile'):
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only customers can access this endpoint
        if request.user.profile.role != 'customer':
            return Response({'error': 'Only customers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the customer's profile
            customer_profile = request.user.profile
            
            # Check if customer has an address
            if not customer_profile.address:
                return Response({
                    'deployments': [],
                    'message': 'No address found for customer'
                })
            
            # Get the customer's barangay
            customer_barangay = customer_profile.address.barangay
            
            # Find routes that include this barangay
            routes_with_barangay = Route.objects.filter(barangays=customer_barangay)
            
            # Get deployments for these routes
            deployments = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').filter(route__in=routes_with_barangay).order_by('-created_at')
            
            serializer = self.get_serializer(deployments, many=True)
            return Response({
                'deployments': serializer.data,
                'message': f'Found {deployments.count()} deployments for your barangay'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
'''

# Insert the new method before the last line
lines = content.split('\n')
# Find the last line that is just a closing brace (end of class)
for i in range(len(lines) - 1, -1, -1):
    if lines[i].strip() == '':
        continue
    if lines[i].strip() == '}':
        # Insert the new method before this line
        lines.insert(i, new_method)
        break

# Write the modified content back to the file
with open(file_path, 'w') as f:
    f.write('\n'.join(lines))

print("Successfully added by_customer_barangay endpoint to DeploymentViewSet")