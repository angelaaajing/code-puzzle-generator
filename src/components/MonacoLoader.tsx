'use client';

import { useEffect } from 'react';
import { loader } from '@monaco-editor/react';

export function MonacoLoader() {
  useEffect(() => {
    // Configure Monaco Editor loader
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
      }
    });
    
    // Preload Monaco Editor
    loader.init().then(() => {
      // Monaco is loaded
      console.log('Monaco editor preloaded');
    }).catch(error => {
      console.error('Monaco editor preload failed', error);
    });
  }, []);
  
  // This component doesn't render anything
  return null;
} 