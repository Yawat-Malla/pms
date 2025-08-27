"use client";
import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <div className="text-red-600 mb-2">Something went wrong</div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 