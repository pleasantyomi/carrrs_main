# Cloudinary Setup for Image Uploads

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Cloudinary Upload Preset Setup

1. Log into your Cloudinary dashboard
2. Go to Settings > Upload
3. Create a new upload preset with the name: `carrrs_uploads`
4. Set the following configuration:
   - Mode: Unsigned
   - Folder: `carrrs/listings`
   - Allowed formats: jpg, png, jpeg, webp
   - Max file size: 5MB
   - Image transformations:
     - Quality: auto
     - Format: auto
     - Width: 1200 (max)
     - Height: 800 (max)
     - Crop: limit

## Features

- Drag & drop image upload
- Multiple image support (up to 5 images per listing)
- Automatic image optimization
- Responsive image delivery
- Real-time upload progress
- Image preview with delete functionality

## Usage

The enhanced add listing form now includes:
- Cloudinary image upload widget integration
- Type-specific form fields based on host's listing types
- Real-time image preview and management
- Comprehensive validation and error handling

## Supported Listing Types

### Cars
- Basic info: Title, brand, model, year
- Pricing: Price per day
- Specifications: Seats, transmission, fuel type
- Features: Multiple selectable car features

### Stays
- Basic info: Property title, location
- Pricing: Price per night
- Specifications: Bedrooms, bathrooms, max guests

### Services
- Basic info: Service title, category
- Pricing: Fixed price
- Specifications: Duration in hours
