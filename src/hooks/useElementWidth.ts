import { useEffect, useState } from 'react';

/**
 * Largura atual de um elemento, atualizada quando ele muda de tamanho.
 * Usa callback ref (não useRef) porque o elemento costuma aparecer só depois
 * do loading — um ref comum não avisaria o efeito quando ele fosse montado.
 */
export function useElementWidth<T extends HTMLElement>(): [(el: T | null) => void, number] {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, width];
}
