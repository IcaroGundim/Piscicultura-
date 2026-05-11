'use client';

import { useEffect } from 'react';
import type { Plugin } from 'react-grab';

const PLUGIN_NAME = 'aquagest-devtools';

/** Remove rastros que o react-grab deixa no DOM (atributos data-react-grab-* e estilos inline de outline) */
function cleanupReactGrabArtifacts() {
  if (typeof document === 'undefined') return;

  const affected = document.querySelectorAll([
    '[data-react-grab-frozen]',
    '[data-react-grab-highlight]',
    '[style*="outline: rgba(59, 130, 246"]',
    '[style*="outline: rgb(59, 130, 246"]',
    '[style*="outline-color: rgba(59, 130, 246"]',
  ].join(', '));

  affected.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    el.removeAttribute('data-react-grab-frozen');
    el.removeAttribute('data-react-grab-highlight');
    // Só limpa outline se foi injetado pelo react-grab (azul padrão dele)
    const outline = el.style.outline;
    if (outline.includes('59, 130, 246') || outline.includes('rgb(59, 130, 246')) {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }
  });
}

export function ReactGrabPlugin() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let isActive = true;
    let unregisterPluginFn: ((name: string) => void) | undefined;

    const init = async () => {
      const { registerPlugin, unregisterPlugin } = await import('react-grab');

      if (!isActive) return;

      const plugin: Plugin = {
        name: PLUGIN_NAME,
        actions: [
          {
            id: 'copy-tank-id',
            label: '🐟 Copiar ID do Tanque',
            shortcut: 'T',
            showInToolbarMenu: true,
            onAction: (ctx) => {
              const el = ctx.element.closest('[data-tank-id]');
              if (el) {
                const tankId = el.getAttribute('data-tank-id');
                navigator.clipboard.writeText(`Tanque ${tankId}`);
              }
              ctx.hideContextMenu();
            },
          },
          {
            id: 'inspect-store',
            label: '🔍 Inspecionar Estado (Zustand)',
            shortcut: 'Z',
            showInToolbarMenu: true,
            onAction: (ctx) => {
              ctx.hideContextMenu();
              import('@/lib/store').then((mod) => {
                const state = mod.useStore.getState();
                console.group('🔷 AquaGest Store State');
                console.log('Tanques:', state.tanks.length);
                console.log('Lotes Berçário:', state.bercarioLotes.length);
                console.log('Lotes Recria:', state.recriaLotes.length);
                console.log('Lotes Engorda:', state.engordaLotes.length);
                console.log('Premissas:', state.premissas);
                console.log('Custos:', state.custos);
                console.groupEnd();
              });
            },
          },
          {
            id: 'open-in-vscode',
            label: '✏️ Abrir no VS Code',
            shortcut: 'V',
            showInToolbarMenu: true,
            onAction: (ctx) => {
              ctx.hideContextMenu();
              console.log('📝 Elemento selecionado. Cole (Ctrl+V) no agente para contexto completo.');
            },
          },
        ],
        hooks: {
          onElementSelect: () => {
            // Sem destaque visual no DOM para evitar poluir os elementos
            // O react-grab já mostra o contexto no clipboard sem precisar marcar o DOM
          },
        },
      };

      registerPlugin(plugin);
      unregisterPluginFn = unregisterPlugin;
      console.log('✅ React Grab plugin "aquagest-devtools" registrado');
    };

    void init().catch((error: unknown) => {
      console.error('❌ Falha ao iniciar React Grab:', error);
    });

    // Cleanup periódico para garantir que nenhum artefato fique preso no DOM
    const interval = setInterval(cleanupReactGrabArtifacts, 2000);

    return () => {
      isActive = false;
      clearInterval(interval);
      unregisterPluginFn?.(PLUGIN_NAME);
    };
  }, []);

  return null;
}
