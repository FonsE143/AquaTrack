# Script to add my_deployment action to DeploymentViewSet

file_path = r'backend\core\api\views.py'

# Read the file
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the line with the end of the by_customer_barangay method and insert the new method after it
insert_index = None
for i in range(len(lines) - 1, -1, -1):
    if "return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)" in lines[i].strip():
        # Found the end of the by_customer_barangay method, insert the new method after the next blank line
        insert_index = i + 2  # +1 for the next line, +1 for the blank line
        break

if insert_index is None:
    print("Could not find the correct location to insert the method")
    exit(1)

# The new method to insert
new_method = [
    "\n",
    "    @action(detail=False, methods=['get'], url_path='my-deployment')\n",
    "    def my_deployment(self, request):\n",
    "        \"\"\"Get the current driver's deployment\"\"\"\n",
    "        if not hasattr(request.user, 'profile'):\n",
    "            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)\n",
    "        \n",
    "        # Only drivers can access their deployment\n",
    "        if request.user.profile.role != 'driver':\n",
    "            return Response({'error': 'Only drivers can access their deployment'}, status=status.HTTP_403_FORBIDDEN)\n",
    "        \n",
    "        try:\n",
    "            # Get the most recent deployment for this driver\n",
    "            deployment = Deployment.objects.select_related('driver', 'vehicle', 'route', 'product').prefetch_related('route__municipalities', 'route__barangays').filter(driver=request.user.profile).latest('created_at')\n",
    "            serializer = self.get_serializer(deployment)\n",
    "            return Response(serializer.data)\n",
    "        except Deployment.DoesNotExist:\n",
    "            return Response({'error': 'No deployment found for this driver'}, status=status.HTTP_404_NOT_FOUND)\n",
    "\n"
]

# Insert the new method
lines[insert_index:insert_index] = new_method

# Write the modified content back to the file
with open(file_path, 'w') as f:
    f.writelines(lines)

print("Successfully added my_deployment action to DeploymentViewSet")