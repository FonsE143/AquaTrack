# Script to remove duplicate function from views.py
file_path = r'backend\core\api\views.py'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the first occurrence of the function
first_occurrence = content.find("@action(detail=False, methods=['get'], url_path='by-customer-barangay')")

# If found, look for the second occurrence
if first_occurrence != -1:
    # Look for second occurrence after the first one
    second_occurrence = content.find("@action(detail=False, methods=['get'], url_path='by-customer-barangay')", first_occurrence + 1)
    
    if second_occurrence != -1:
        # Find the end of the second function (look for the except block)
        except_start = content.find("except Exception as e:", second_occurrence)
        if except_start != -1:
            # Find the end of the except block
            return_start = content.find("return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)", except_start)
            if return_start != -1:
                # Find the end of the line
                end_of_line = content.find("\n", return_start)
                if end_of_line != -1:
                    # Remove the duplicate function
                    new_content = content[:second_occurrence] + content[end_of_line + 1:]
                    
                    # Write back to file
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print("Duplicate function removed successfully")
                else:
                    print("Could not find end of line")
            else:
                print("Could not find return statement")
        else:
            print("Could not find except block")
    else:
        print("No duplicate function found")
else:
    print("Function not found")