import { buildWaitTimeGradientStops } from '@/utils/waitTimeColorScale';

interface Props {
  id: string;
  /** menor valor da série — define o fundo do degradê da linha (stroke) */
  min: number;
  /** maior valor da série — topo do degradê tanto da linha quanto do preenchimento */
  max: number;
  /** opacidade do preenchimento junto à linha; desce até 0 na base (efeito de "sumiço") */
  fillOpacity?: number;
}

/**
 * Gradientes verticais reaproveitados por qualquer gráfico de linha/área do
 * app: a cor acompanha o valor (mesma paleta do heatmap/calendário) em vez de
 * ser fixa, e o preenchimento esmaece em direção à base do gráfico.
 *
 * IMPORTANTE: chame como função (`{waitTimeGradientDefs({...})}`), nunca como
 * componente (`<WaitTimeGradientDefs .../>`). O Recharts só repassa pro SVG
 * filhos que já chegam como elementos SVG crus (`<defs>`, `<g>`...) ou como um
 * dos seus próprios componentes conhecidos — um componente React qualquer,
 * mesmo que só retorne `<defs>`, é descartado silenciosamente pelo
 * `renderByOrder` interno dele. Chamando como função simples, o `<defs>`
 * retornado já chega pronto na árvore, sem esse wrapper.
 */
export function waitTimeGradientDefs({ id, min, max, fillOpacity = 0.4 }: Props) {
  const strokeStops = buildWaitTimeGradientStops(min, max);
  // O preenchimento vai até a base do eixo (0), não até o mínimo da série —
  // é literalmente a área sob a curva, então seu "topo/base" real é [0, max].
  const fillStops = buildWaitTimeGradientStops(0, max);

  return (
    <defs>
      <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="0" y2="1">
        {strokeStops.map((s) => (
          <stop key={s.offset} offset={`${s.offset * 100}%`} stopColor={s.color} />
        ))}
      </linearGradient>
      <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
        {fillStops.map((s) => (
          <stop key={s.offset} offset={`${s.offset * 100}%`} stopColor={s.color} stopOpacity={fillOpacity * (1 - s.offset)} />
        ))}
      </linearGradient>
    </defs>
  );
}
