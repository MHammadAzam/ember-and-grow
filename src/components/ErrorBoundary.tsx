import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logError } from "@/lib/errorLog";

interface Props { children: ReactNode }
interface State { error: Error | null }

/** App-wide error boundary. Prevents a thrown render error from blanking
 *  the screen after actions like claiming rewards or switching themes. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Surface for debugging without breaking the UI.
    console.error("[LifeForge] render error:", error, info);
    const componentStack =
      info && typeof info === "object" && "componentStack" in info
        ? String((info as { componentStack?: string }).componentStack ?? "")
        : "";
    logError({
      source: "render",
      message: error.message,
      stack: `${error.stack ?? ""}\n${componentStack}`.trim(),
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-xl">Something glitched</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your data is safe on this device. Try again — no need to reload.
            </p>
          </div>
          {import.meta.env.DEV && (
            <pre className="text-[10px] text-left text-muted-foreground bg-muted/40 p-2 rounded overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={this.reset}>
              Dismiss
            </Button>
            <Button className="flex-1" onClick={() => { this.reset(); window.history.back(); }}>
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
