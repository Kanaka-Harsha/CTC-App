#!/bin/bash

S3_BUCKET=""
CLOUDFRONT_DIST_ID=""

# Define colors for attractive output
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting Deployment Process...${NC}\n"

echo -e "${YELLOW}Step 1: 🛠️  Building The Frontend...${NC}"
cd CTC-FrontEnd

if npm run build; then
    echo -e "${GREEN}✅ Build Successful!${NC}\n"
    
    echo -e "${YELLOW}Step 2: ☁️  Uploading the code to S3 Bucket...${NC}"
    if aws s3 sync dist/ $S3_BUCKET --delete; then
        echo -e "${GREEN}✅ Upload Successful!${NC}\n"
        
        echo -e "${YELLOW}Step 3: 🔄 Invalidating The CloudFront Cache...${NC}"
        if aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"; then
            echo -e "\n${GREEN}🎉 Deployment Completely Successful! Your app is live. 🚀${NC}"
        else
            echo -e "${RED}❌ ERROR: Failed to invalidate CloudFront cache.${NC}"
            exit 1
        fi

    else
        echo -e "${RED}❌ ERROR: Failed to upload to S3 Bucket. Deployment stopped.${NC}"
        exit 1
    fi

else
    echo -e "${RED}❌ ERROR: Frontend build failed. Deployment stopped.${NC}"
    exit 1
fi
