#!/bin/bash

set -e

SOURCE_FILE="./packages/server/.env.local"
WEB_DEST_FILE="./apps/web/.env.local"
CHROME_DEST_FILE="./apps/browser/.env.development"

echo "Copying and modifying environment file for web app..."
echo "Source: $SOURCE_FILE"
echo "Destination: $WEB_DEST_FILE"

sed 's/^CONVEX_URL=/NEXT_PUBLIC_CONVEX_URL=/' "$SOURCE_FILE" > "$WEB_DEST_FILE"

echo "Successfully copied $SOURCE_FILE to $WEB_DEST_FILE"
echo "Changed CONVEX_URL to NEXT_PUBLIC_CONVEX_URL"

echo "Copying and modifying environment file for chrome extension..."
echo "Source: $SOURCE_FILE"
echo "Destination: $CHROME_DEST_FILE"

sed 's/^CONVEX_URL=/PLASMO_PUBLIC_CONVEX_URL=/' "$SOURCE_FILE" > "$CHROME_DEST_FILE"

echo "Successfully copied $SOURCE_FILE to $CHROME_DEST_FILE"
echo "Changed CONVEX_URL to PLASMO_PUBLIC_CONVEX_URL"

SCRAPER_DEST_FILE="./apps/scraper/.env"

echo "Setting up scraper environment file..."
echo "Source: $SOURCE_FILE"
echo "Destination: $SCRAPER_DEST_FILE"

CONVEX_SITE_URL="http://127.0.0.1:3211"

echo "CONVEX_SITE_URL=$CONVEX_SITE_URL" > "$SCRAPER_DEST_FILE"

echo "Successfully created $SCRAPER_DEST_FILE with CONVEX_SITE_URL=$CONVEX_SITE_URL"

echo "Setting up Clerk JWT issuer domain..."
CLERK_JWT_ISSUER_DOMAIN=$(doppler secrets get CLERK_JWT_ISSUER_DOMAIN --plain)
echo "Retrieved CLERK_JWT_ISSUER_DOMAIN from Doppler: $CLERK_JWT_ISSUER_DOMAIN"

echo "Setting CLERK_JWT_ISSUER_DOMAIN in Convex environment..."
(cd ./packages/server && bunx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN")

echo "Setting up CONVEX_API_KEY..."
CONVEX_API_KEY=$(doppler secrets get CONVEX_API_KEY --plain)
echo "Retrieved CONVEX_API_KEY from Doppler"

echo "Setting CONVEX_API_KEY in Convex environment..."
(cd ./packages/server && bunx convex env set CONVEX_API_KEY "$CONVEX_API_KEY")

echo "Adding CONVEX_API_KEY to scraper environment file..."
echo "CONVEX_API_KEY=$CONVEX_API_KEY" >> "$SCRAPER_DEST_FILE"

echo "Setting up SCRAPER_URL..."
SCRAPER_URL=$(doppler secrets get SCRAPER_URL --plain)
echo "Retrieved SCRAPER_URL from Doppler: $SCRAPER_URL"

echo "Setting SCRAPER_URL in Convex environment..."
(cd ./packages/server && bunx convex env set SCRAPER_URL "$SCRAPER_URL")

echo "Setup complete!"
