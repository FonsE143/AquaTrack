# Script to add my_deployment action to DeploymentViewSet

file_path = r'backend\core\api\views.py'

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Find the retrieve method and add the new method after it
lines = content.split('\n')
new_lines = []

i = 0
while i < len(lines):
    line = lines[i]
    new_lines.append(line)
    
    # Check if this is the start of the retrieve method
    if line.strip() == 'def retrieve(self, request, *args, **kwargs):':
        # Skip the next 6 lines (the rest of the retrieve method)
        for j in range(7):  # 6 lines + 1 for the blank line after
            if i + j + 1 < len(lines):
                # Don't add these lines to new_lines
                pass
            else:
                break
        
        # Add the new method
        new_lines.extend([
            '    ',
            '    @action(detail=False, methods=[\'get\'], url_path=\'my-deployment\')',
            '    def my_deployment(self, request):',
            '        """Get the current driver\'s deployment"""',
            '        if not hasattr(request.user, \'profile\'):',
            '            return Response({\'error\': \'Profile not found\'}, status=status.HTTP_404_NOT_FOUND)',
            '        ',
            '        # Only drivers can access their deployment',
            '        if request.user.profile.role != \'driver\':',
            '            return Response({\'error\': \'Only drivers can access their deployment\'}, status=status.HTTP_403_FORBIDDEN)',
            '        ',
            '        try:',
            '            # Get the most recent deployment for this driver',
            '            deployment = Deployment.objects.select_related(\'driver\', \'vehicle\', \'route\', \'product\').prefetch_related(\'route__municipalities\').filter(driver=request.user.profile).latest(\'created_at\')',
            '            serializer = self.get_serializer(deployment)',
            '            return Response(serializer.data)',
            '        except Deployment.DoesNotExist:',
            '            return Response({\'error\': \'No deployment found for this driver\'}, status=status.HTTP_404_NOT_FOUND)',
            '    '
        ])
        
        # Add back the retrieve method line and continue
        i += 7  # Skip the retrieve method lines
        continue
    
    i += 1

# Write the modified content back to the file
with open(file_path, 'w') as f:
    f.write('\n'.join(new_lines))

print("Successfully added my_deployment action to DeploymentViewSet")