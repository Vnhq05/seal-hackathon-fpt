/**
 * Avatar upload is not supported by the backend API.
 * This hook is a no-op stub kept for backward compatibility
 * so existing components don't break at import time.
 */
export function useUploadAvatar() {
  return {
    uploadAvatar: (_file: File) => {
      console.warn("Avatar upload is not supported by the backend.");
    },
    isPending: false,
  };
}
