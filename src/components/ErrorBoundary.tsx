import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[StudyOS Mobile] Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/app';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            StudyOS ran into an unexpected issue. Don't worry, your notes and session data are safe.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/80 active:scale-95 transition-transform"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
