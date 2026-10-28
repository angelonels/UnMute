/** Synchronous ownership closes the gap between creating a preview and a React effect. */
export function createObjectUrlOwner() {
  const urls = new Map<string, () => void>();
  const release = (url: string) => {
    urls.get(url)?.();
    urls.delete(url);
  };
  return {
    create(blob: Blob) {
      const url = URL.createObjectURL(blob);
      urls.set(url, () => URL.revokeObjectURL(url));
      return url;
    },
    release,
    clear() {
      urls.forEach((dispose) => dispose());
      urls.clear();
    },
  };
}
