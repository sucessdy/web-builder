const MAX_IMAGE_SIZE = 1_000_000;

export function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choose an image file."));
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return Promise.reject(new Error("Images must be 1 MB or smaller."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Could not read the image file."));
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}
