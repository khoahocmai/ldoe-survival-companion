import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Keeps a crash in one page from blanking the whole app: show the error and a way out instead. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Lỗi hiển thị trang:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold">Trang này bị lỗi</h2>
        <p className="break-words font-mono text-xs text-danger">{error.message}</p>
        <div className="flex gap-2">
          <Button onClick={() => this.setState({ error: null })}>Thử lại</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
      </div>
    );
  }
}
