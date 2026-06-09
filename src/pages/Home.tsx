import { useNavigate } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Spinner, ErrorMessage } from '@/components/ui';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Park } from '@/types';

// ── Dropdown via Portal (evita ser cortado por overflow/z-index de ancestrais) ──
function ParkDropdown({
  parks,
  loading,
  error,
  anchorRef,
  onSelect,
  onClose,
}: {
  parks: Park[];
  loading: boolean;
  error: string | null;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onSelect: (park: Park) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Posiciona o painel exatamente abaixo do botão
  useEffect(() => {
    if (anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect());
    }
  }, [anchorRef]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  const filtered = parks.filter(p =>
    p.park_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!rect) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      className="bg-brand-card border border-brand-border rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="p-2 border-b border-brand-border">
        <input
          autoFocus
          type="text"
          placeholder="Buscar parque..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="
            w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border
            text-white placeholder-brand-muted font-body text-sm
            focus:outline-none focus:border-brand-red/60
            transition-all
          "
        />
      </div>

      <ul className="max-h-64 overflow-y-auto">
        {loading && (
          <li className="flex justify-center py-6"><Spinner size={20} /></li>
        )}
        {error && (
          <li className="px-4 py-3"><ErrorMessage message={error} /></li>
        )}
        {!loading && filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-brand-muted text-sm">
            Nenhum parque encontrado para "{search}".
          </li>
        )}
        {!loading && filtered.map(park => (
          <li key={park.park_id}>
            <button
              onClick={() => onSelect(park)}
              className="
                w-full text-left px-5 py-3 text-sm font-body
                text-white/80 hover:text-white hover:bg-brand-red/10
                transition-all flex items-center justify-between group
              "
            >
              <span>{park.park_name}</span>
              <span className="text-brand-red text-xs opacity-0 group-hover:opacity-100 transition-opacity font-display tracking-widest">
                VER →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}

// ── Componente Principal ──
export function Home() {
  const navigate = useNavigate();
  const { data: parks, loading, error } = useQuery(() => api.getParks());
  const [isOpen, setIsOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (park: Park) => {
    navigate(`/park/${park.park_id}`, { state: { parkName: park.park_name } });
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-body">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239,35,60,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,35,60,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-20 pb-16">

        {/* ── Header ── */}
        <div className="mb-14 animate-fade-up" style={{ animationDelay: '0s', opacity: 0 }}>
          <p className="font-display text-xs tracking-[0.3em] text-brand-red uppercase mb-4">
            Theme Park Analytics
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-4">
            Inteligência<br />
            <span className="text-brand-red">de Filas</span>
          </h1>
          <p className="text-brand-muted text-lg max-w-md leading-relaxed">
            Histórico real de tempos de espera, calendários de lotação e status ao vivo
            de parques temáticos ao redor do mundo.
          </p>
        </div>

        {/* ── Dropdown ── */}
        <div className="animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <button
            ref={anchorRef}
            onClick={() => setIsOpen(prev => !prev)}
            className="
              w-full flex items-center justify-between
              px-5 py-4 rounded-xl bg-brand-card border border-brand-border
              text-white font-body text-sm
              hover:border-brand-muted/40 focus:outline-none focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/30
              transition-all
            "
          >
            <span className="text-brand-muted">Selecione um parque...</span>
            {isOpen
              ? <ChevronUp size={16} className="text-brand-muted shrink-0" />
              : <ChevronDown size={16} className="text-brand-muted shrink-0" />
            }
          </button>

          {isOpen && (
            <ParkDropdown
              parks={parks ?? []}
              loading={loading}
              error={error}
              anchorRef={anchorRef}
              onSelect={handleSelect}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>

        {/* ── Documentação Estática ── */}
        <div
          className="mt-20 space-y-12 animate-fade-up"
          style={{ animationDelay: '0.3s', opacity: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-brand-border" />
            <span className="font-display text-xs tracking-[0.3em] text-brand-muted uppercase">
              Sobre o Projeto
            </span>
            <div className="h-px flex-1 bg-brand-border" />
          </div>

          {/* 1. Introdução */}
          <section className="space-y-3">
            <h2 className="font-display text-xs tracking-[0.2em] text-brand-red uppercase">
              01 — Introdução e Contexto Histórico
            </h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Este projeto nasceu em 2023 da necessidade de entender o comportamento das filas e a
              lotação do <span className="text-white">Beto Carrero World (BCW)</span>. Inicialmente,
              a abordagem era manual e reativa: os dados eram extraídos do site <em>Thrill-Data</em> por
              meio de downloads mensais e individuais por atração, analisados em notebooks Jupyter com
              relatórios estáticos e sem interatividade.
            </p>
            <p className="text-brand-muted text-sm leading-relaxed">
              Em meados de 2025, o projeto foi completamente reestruturado para um{' '}
              <span className="text-white">pipeline de dados automatizado, escalável e dinâmico</span>,
              utilizando infraestrutura em nuvem e ferramentas modernas de Data Engineering. Em 2026,
              evoluiu para uma <span className="text-white">aplicação web completa</span> com
              separação de responsabilidades entre front-end e back-end.
            </p>
          </section>

          {/* 2. Arquitetura */}
          <section className="space-y-4">
            <h2 className="font-display text-xs tracking-[0.2em] text-brand-red uppercase">
              02 — Arquitetura Técnica e Pipeline
            </h2>
            <ul className="space-y-3">
              {[
                { label: 'Fonte de Dados', desc: 'Integração direta com a API do Queue-Times.com, que fornece dados em tempo real baseados nos aplicativos oficiais dos parques.' },
                { label: 'Processamento (ETL)', desc: 'Funções AWS Lambda com rotinas periódicas que consomem a API, normalizam os dados para um esquema padrão e os organizam automaticamente.' },
                { label: 'Armazenamento', desc: 'GitHub como repositório de backup em .csv e Google BigQuery como warehouse analítico para consultas rápidas sobre grandes volumes históricos.' },
                { label: 'Back-end', desc: 'API REST dedicada em Node.js, desacoplada da camada de visualização, com endpoints otimizados por parque e tipo de análise.' },
                { label: 'Front-end', desc: 'Aplicação React com TypeScript, roteamento client-side, componentes reutilizáveis e design system próprio — substituindo o Streamlit monolítico.' },
              ].map(item => (
                <li key={item.label} className="flex gap-3 text-sm">
                  <span className="text-brand-red font-mono shrink-0 mt-0.5">→</span>
                  <span>
                    <span className="text-white font-medium">{item.label}:</span>{' '}
                    <span className="text-brand-muted">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Funcionalidades */}
          <section className="space-y-4">
            <h2 className="font-display text-xs tracking-[0.2em] text-brand-red uppercase">
              03 — Funcionalidades
            </h2>
            <div className="overflow-x-auto rounded-xl border border-brand-border">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left px-4 py-3 text-brand-muted font-normal tracking-wider">Funcionalidade</th>
                    <th className="text-left px-4 py-3 text-brand-muted font-normal tracking-wider">Descrição</th>
                    <th className="text-left px-4 py-3 text-brand-muted font-normal tracking-wider">Lógica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {[
                    {
                      name: '⚡ Tempo Real',
                      desc: 'Status atual, Top 4 esperas e evolução temporal do dia.',
                      logic: 'GET API comparado ao histórico do mesmo dia para indicar tendência.',
                    },
                    {
                      name: '📊 Por Atração',
                      desc: 'Gráfico de barras segmentado por janelas horárias.',
                      logic: 'Agrupamento histórico com destaque automático nos 3 horários de pico.',
                    },
                    {
                      name: '📅 Calendário',
                      desc: 'Heatmap anual de lotação diária.',
                      logic: 'Média das atrações mecânicas com escala calibrada por quartis.',
                    },
                  ].map(row => (
                    <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white">{row.name}</td>
                      <td className="px-4 py-3 text-brand-muted">{row.desc}</td>
                      <td className="px-4 py-3 text-brand-muted">{row.logic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Qualidade BCW */}
          <section className="space-y-3">
            <h2 className="font-display text-xs tracking-[0.2em] text-brand-red uppercase">
              04 — Tratamentos de Qualidade (BCW)
            </h2>
            <ul className="space-y-2">
              {[
                'Normalização de nomes: ajuste de caixa alta e unificação de marcas (ex: Big Tower → Big Drop).',
                'Limpeza de outliers: filtros para ignorar erros de digitação de operadores (ex: 990 min).',
                'Filtro de operação: remoção de períodos com parque fechado para preservar médias reais.',
                'Seleção de IDs: apenas atrações mecânicas, excluindo shows e zoológico dos cálculos de lotação.',
              ].map(item => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-brand-red font-mono shrink-0 mt-0.5">→</span>
                  <span className="text-brand-muted">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Próximos Passos */}
          <section className="space-y-3">
            <h2 className="font-display text-xs tracking-[0.2em] text-brand-red uppercase">
              05 — Próximos Passos
            </h2>
            <ul className="space-y-2">
              {[
                'Expansão da limpeza de dados para parques internacionais (Disney, Universal, etc.).',
                'Implementação de modelos de Machine Learning para predição de filas futuras.',
                'Autenticação de usuários com histórico de parques favoritos.',
                'PWA com notificações push para alertas de pico em tempo real.',
              ].map(item => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-brand-red font-mono shrink-0 mt-0.5">→</span>
                  <span className="text-brand-muted">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Changelog */}
          <section className="space-y-4">
            <button
              onClick={() => setChangelogOpen(!changelogOpen)}
              className="w-full flex items-center justify-between group"
            >
              <h2 className="font-display text-xs tracking-[0.2em] text-brand-red uppercase">
                06 — Histórico de Versões
              </h2>
              {changelogOpen
                ? <ChevronUp size={14} className="text-brand-muted" />
                : <ChevronDown size={14} className="text-brand-muted" />
              }
            </button>

            {changelogOpen && (
              <div className="space-y-8 pt-2">
                {[
                  {
                    version: 'v2.0', label: 'Atual',
                    items: [
                      '🏗️ Mudança de Stack: migração completa do Streamlit monolítico para uma arquitetura desacoplada com React + TypeScript no front-end e API REST em Node.js no back-end.',
                      '🎨 Design System próprio: tipografia, paleta de cores, componentes e tokens visuais consistentes — impossível de atingir no Streamlit.',
                      '⚡ Performance de SPA: navegação instantânea entre páginas sem recarregamento, com roteamento client-side via React Router.',
                      '📦 Componentes reutilizáveis: arquitetura baseada em componentes isolados, hooks customizados e separação clara de responsabilidades.',
                      '🔌 API REST dedicada: back-end independente com endpoints otimizados, cache de respostas e estrutura preparada para escalar.',
                      '📱 Responsividade real: layout adaptado nativamente via Tailwind, sem os workarounds de CSS do Streamlit.',
                    ],
                  },
                  {
                    version: 'v1.1', label: null,
                    items: [
                      '⚡ Otimização de Performance: migração de agregações para o servidor. Redução de 95% no tráfego de dados.',
                      '🌡️ Análise Diária e Heatmap Dinâmico: consulta de datas passadas com intervalo configurável (15m, 30m, 1h).',
                      '🚫 Detecção de Paradas Técnicas: transparência em blocos com fila = 0 para evitar distorções.',
                      '📱 UX Responsiva: transposição automática de matriz para mobile com nomes no topo do gráfico.',
                      '📜 Notas de Versão: inclusão do painel de changelog.',
                    ],
                  },
                  {
                    version: 'v1.0', label: null,
                    items: [
                      '🌍 Expansão Global: suporte a parques internacionais com mapeamento de fusos horários.',
                      '🔴 Hoje no Parque: aba de tempo real via API com alertas de maiores filas.',
                      '📖 Documentação Integrada: tela inicial com contexto histórico e arquitetura técnica.',
                    ],
                  },
                  {
                    version: 'v0.1', label: 'MVP',
                    items: [
                      '🎡 Projeto Piloto exclusivo para o Beto Carrero World.',
                      '📊 Gráficos de médias horárias históricas por atração.',
                      '📅 Heatmap anual baseado em matrizes estatísticas de espera.',
                    ],
                  },
                ].map(({ version, label, items }) => (
                  <div key={version}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-white font-bold">{version}</span>
                      {label && (
                        <span className="font-display text-[10px] tracking-widest text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded-md uppercase">
                          {label}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {items.map(item => (
                        <li key={item} className="flex gap-3 text-sm">
                          <span className="text-brand-border font-mono shrink-0 mt-0.5">–</span>
                          <span className="text-brand-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-brand-border animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-brand-muted text-xs font-mono">
            <div>
              <p className="text-white/60 mb-1">Luis Fernando Melnek Tacla</p>
              <div className="flex gap-4">
                <a href="https://www.linkedin.com/in/luis-fernando-melnek-tacla/" target="_blank" rel="noreferrer"
                  className="hover:text-brand-red transition-colors">LinkedIn</a>
                <a href="https://github.com/LuisFTacla" target="_blank" rel="noreferrer"
                  className="hover:text-brand-red transition-colors">GitHub</a>
              </div>
            </div>
            <div className="text-right">
              <p>Powered by Queue-Times.com</p>
              <p>Google BigQuery · AWS Lambda · Vercel</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}