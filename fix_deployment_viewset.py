# Script to properly add by_customer_barangay endpoint to DeploymentViewSet

file_path = r'backend\core\api\views.py'

# Read the file
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the line with the end of the retrieve method and insert the new method after it
for i in range(len(lines)):
    if "return Response({'error': str(e)}, status=500)" in lines[i].strip():
        # Found the end of the retrieve method, insert the new method after the next blank line
        insert_index = i + 2  # +1 for the next line, +1 for the blank line
        break

# The new method to insert
new_method = [
    "\n",
    "    @action(detail=False, methods=['get'], url_path='by-customer-barangay')\n",
    "    def by_customer_barangay(self, request):\n",
    "        \"\"\"Get deployments for the current customer's barangay\"\"\"\n",
    "        if not hasattr(request.user, 'profile'):\n",
    "            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)\n",
    "        \n",
    "        # Only customers can access this endpoint\n",
    "        if request.user.profile.role != 'customer':\n",
    "            return Response({'error': 'Only customers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)\n",
    "        \n",
    "        try:\n",
    "            # Get the customer's profile\n",
    "            customer_profile = request.user.profile\n",
    "            \n",
    "            # Check if customer has an address\n",
    "            if not customer_profile.address:\n",
    "                return Response({\n",
    "                    'deployments': [],\n",
    "                    'message': 'No address found for customer'\n",
    "                })\n",
    "            \n",
    "            # Get the customer's barangay\n",
    "            customer_barangay = customer_profile.address.barangay\n",
    "            \n",
    "            # Find routes that include this barangay\n",
    "            routes_with_barangay = Route.objects.filter(barangays=customer_barangay)\n",
    "            \n",
    "            # Get deployments for these routes\n",
    "            deployments = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').filter(route__in=routes_with_barangay).order_by('-created_at')\n",
    "            \n",
    "            serializer = self.get_serializer(deployments, many=True)\n",
    "            return Response({\n",
    "                'deployments': serializer.data,\n",
    "                'message': f'Found {deployments.count()} deployments for your barangay'\n",
    "            })\n",
    "        except Exception as e:\n",
    "            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)\n",
    "\n"
]

# Insert the new method
lines[insert_index:insert_index] = new_method

# Write the modified content back to the file
with open(file_path, 'w') as f:
    f.writelines(lines)

print("Successfully added by_customer_barangay endpoint to DeploymentViewSet")