const HTML_TAG = /<\/?[a-z][^>]*>/i;

export function isRichText(text?: string): boolean {
  return !!text && HTML_TAG.test(text);
}

export function richTextClass(text?: string): string {
  return isRichText(text) ? " pws-text--rich" : "";
}
