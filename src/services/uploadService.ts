import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebaseConfig';

/**
 * Root Cause Analysis: storage/unknown in React Native
 * 1. Blob handling: React Native's fetch().blob() is often unstable or returns incompatible objects.
 * 2. MIME type mismatch: Missing or incorrect 'Content-Type' can trigger internal Firebase errors.
 * 3. Network issues: React Native networking polyfills can sometimes drop connections during large uploads.
 * 4. Path URI: URIs like 'file://' or 'content://' (Android) require specific handling.
 */

/**
 * Convert a URI to a Blob using XMLHttpRequest (XHR).
 * This is the MOST reliable method in React Native to ensure Firebase 
 * receives a valid binary object.
 */
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      // success
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error("❌ uriToBlob Error:", e);
      reject(new Error(`Failed to convert URI to Blob: ${uri}`));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

/**
 * Uploads an image (URI or Base64) to Firebase Storage.
 * @param uriOrBase64 The source image (HTTPS URL, data:image, or local file:// path)
 * @param folder The target folder in storage (e.g., 'designs/user123')
 * @returns The permanent download URL
 */
export const uploadImage = async (
  uriOrBase64: string,
  folder: string,
  fileName: string = `${Date.now()}.jpg`
): Promise<string> => {
  try {
    // 1. Validation
    if (!uriOrBase64) {
      throw new Error("Missing image source (URI/Base64)");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("Authentication Required: User must be logged in to upload files.");
    }

    // 2. Short-circuit for already remote URLs
    const isString = typeof uriOrBase64 === 'string';
    if (isString && uriOrBase64.startsWith('http') && !uriOrBase64.includes('file://')) {
      console.log("ℹ️ Image is already remote, skipping upload.");
      return uriOrBase64;
    }

    console.log(`⏳ Starting upload to: ${folder}/${fileName}`);

    let blob: Blob;

    // 3. Handle Base64 vs File URI
    const isBase64 = isString && uriOrBase64.startsWith('data:');
    console.log("🛠️ Platform detected URI type:", isBase64 ? 'Base64' : 'Local File');
    blob = await uriToBlob(uriOrBase64);
    
    console.log(`📦 Blob created: Type=${blob.type}, Size=${(blob.size / 1024).toFixed(2)} KB`);

    // 4. Perform Upload
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Use metadata to be explicit about content type
    const metadata = {
      contentType: 'image/jpeg',
    };

    console.log("🚀 Starting uploadBytes...");
    const uploadTask = await uploadBytes(storageRef, blob, metadata);
    console.log(`✅ Upload successful: ${uploadTask.metadata.fullPath}`);

    // 5. Get Download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // Clean up blob to free memory
    if (typeof (blob as any).close === 'function') {
      (blob as any).close();
    }

    return downloadUrl;

  } catch (error: any) {
    console.error("🚨 Firebase Storage Upload Failed!");
    console.error("Error Detail:", JSON.stringify(error, null, 2));

    // Handle specific Firebase codes
    if (error.code === 'storage/unauthorized') {
      throw new Error("Firebase Rules: Permission Denied. Check your Storage Security Rules.");
    }
    if (error.code === 'storage/quota-exceeded') {
      throw new Error("Storage Quota Exceeded. Please check your Firebase billing/plan.");
    }

    throw new Error(`Upload Error (${error.code || 'unknown'}): ${error.message}`);
  }
};
