/** Copies text to the clipboard. Resolves to false when the browser refuses (the caller then tells the person to copy by hand). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
