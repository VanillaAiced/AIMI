import os
import sys
import django

# Clear any cached imports
if 'base.serializers' in sys.modules:
    del sys.modules['base.serializers']
if 'base.models' in sys.modules:
    del sys.modules['base.models']

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from base.serializers import DepartmentSerializer

# Try to create
data = {"name": "TestDept123"}
serializer = DepartmentSerializer(data=data)
print("Fields:", serializer.fields)
print("School field required:", serializer.fields.get('school').required if 'school' in serializer.fields else "N/A")
if serializer.is_valid():
    print("Valid! Created:", serializer.save())
else:
    print("Errors:", serializer.errors)

