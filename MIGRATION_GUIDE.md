# Database Migration Guide

## Enhanced Host System Migration

This migration adds support for the enhanced host system with listing types, Cloudinary images, and improved table structure.

### Prerequisites

1. Make sure you have access to your Supabase SQL editor
2. Backup your existing data (recommended)

### Migration Steps

#### Option 1: Using Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `006_update_tables_for_enhanced_host_system.sql`
4. Click "Run" to execute the migration

#### Option 2: Using Node.js Script

```bash
# Install dependencies (if not already installed)
npm install @supabase/supabase-js dotenv

# Run the migration script
node scripts/run-migration.js
```

### What This Migration Does

1. **Profiles Table Updates**
   - Adds `listing_types` column (array of allowed listing types per host)
   - Updates existing hosts with all listing types for backward compatibility

2. **Cars Table Updates**
   - Adds `status` column for listing status management
   - Updates existing cars to have 'active' status

3. **Services Table Updates**
   - Adds `category` column for service categorization
   - Adds `duration` column for service duration in hours
   - Adds `status` column for listing status management

4. **Stays Table Creation**
   - Creates new stays table for accommodation listings
   - Includes fields for bedrooms, bathrooms, max_guests
   - Supports Cloudinary image URLs
   - Includes amenities array

5. **Security & Performance**
   - Enables Row Level Security (RLS) on all tables
   - Creates appropriate RLS policies
   - Adds database indexes for better performance
   - Creates helper functions for validation

6. **Data Integrity**
   - Adds triggers for automatic timestamp updates
   - Creates validation functions
   - Maintains referential integrity

### Verification

After running the migration, verify it worked by:

1. Checking that the `listing_types` column exists in profiles
2. Verifying that the `stays` table was created
3. Confirming that status columns were added to cars and services
4. Testing host registration with listing type selection
5. Trying to create different types of listings

### Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove added columns (be careful with data loss)
ALTER TABLE profiles DROP COLUMN IF EXISTS listing_types;
ALTER TABLE cars DROP COLUMN IF EXISTS status;
ALTER TABLE services DROP COLUMN IF EXISTS category;
ALTER TABLE services DROP COLUMN IF EXISTS duration;
ALTER TABLE services DROP COLUMN IF EXISTS status;

-- Drop stays table (will lose all stays data)
DROP TABLE IF EXISTS stays;

-- Drop helper functions
DROP FUNCTION IF EXISTS validate_host_listing_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### Support

If you encounter any issues during migration:

1. Check the Supabase logs for error details
2. Verify your environment variables are set correctly
3. Ensure you have the necessary permissions in Supabase
4. Try running individual SQL statements if the full script fails

### Testing the New Features

After migration, test these new features:

1. **Host Registration**: Try registering as a host and selecting listing types
2. **Add Listings**: Create cars, stays, and services listings
3. **Image Uploads**: Test Cloudinary integration
4. **Listing Management**: View and manage listings in the host dashboard
5. **Type Filtering**: Filter listings by type in the management interface
