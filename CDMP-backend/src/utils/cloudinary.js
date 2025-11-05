const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
// Get your credentials from: https://cloudinary.com/console
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64String - Base64 encoded image string
 * @param {string} folder - Folder name in Cloudinary (default: 'complaints')
 * @returns {Promise<string>} - URL of uploaded image
 */
const uploadBase64Image = async (base64String, folder = 'complaints') => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.includes('base64,') 
      ? base64String.split('base64,')[1] 
      : base64String;

    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        folder: folder,
        resource_type: 'image',
        format: 'jpg',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
          { quality: 'auto:good' } // Automatic quality optimization
        ]
      }
    );

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Full URL of the image
 */
const deleteImage = async (imageUrl) => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  cloudinary,
  uploadBase64Image,
  deleteImage
};
