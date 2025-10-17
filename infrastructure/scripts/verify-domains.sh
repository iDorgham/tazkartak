#!/bin/bash

echo "Verifying domain configuration..."

# Check API domain
echo "Checking api.yourdomain.com..."
curl -I https://api.yourdomain.com/health

# Check Frontend domain
echo "Checking yourdomain.com..."
curl -I https://yourdomain.com

# Check Widget domain
echo "Checking widget.yourdomain.com..."
curl -I https://widget.yourdomain.com

echo "Domain verification complete!"
