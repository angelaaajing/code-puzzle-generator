'use client';

import { useEffect } from 'react';

// Add global type for monaco loaded via script tags
declare global {
  interface Window {
    monaco: {
      editor: {
        colorize: (code: string, language: string, options: object) => Promise<string>;
      }
    };
    require: {
      config: (options: { paths: Record<string, string> }) => void;
      (modules: string[], callback: () => void): void;
    };
    monacoReady?: boolean;
  }
}

export function MonacoLoader() {
  useEffect(() => {
    // Only load Monaco once
    if (typeof window !== 'undefined' && !document.getElementById('monaco-script')) {
      const script = document.createElement('script');
      script.id = 'monaco-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs/loader.min.js';
      script.async = true;
      script.onload = () => {
        if (window.require) {
          window.require.config({
            paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }
          });
          
          // Load the monaco editor base
          window.require(['vs/editor/editor.main'], function() {
            console.log('Monaco editor loaded successfully');
            
            // Add a global flag to indicate Monaco is ready
            window.monacoReady = true;
            
            // Dispatch an event so components can react
            window.dispatchEvent(new Event('monaco-ready'));
          });
        }
      };
      document.head.appendChild(script);
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 