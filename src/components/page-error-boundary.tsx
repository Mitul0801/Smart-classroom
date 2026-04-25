'use client';

import React from 'react';
import { ErrorState } from '@/components/error-state';

interface State {
  hasError: boolean;
}

export class PageErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Page boundary error', error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={this.props.onRetry} />;
    }

    return this.props.children;
  }
}
