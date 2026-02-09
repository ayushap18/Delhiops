import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="flex flex-col items-center justify-center p-8 border border-danger/10 bg-gray-950"
            role="alert"
          >
            <AlertTriangle className="h-8 w-8 text-danger mb-3" />
            <h3 className="text-xs font-mono font-bold text-danger tracking-wider">
              [SYSTEM ERROR]
            </h3>
            <p className="mt-2 text-[10px] font-mono text-gray-600">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 tracking-wider transition-colors"
            >
              RETRY_OPERATION
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
