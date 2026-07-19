/**
 * ErrorBoundary — Production-grade React error boundary with elegant fallback UI.
 * Catches rendering errors in child components and displays a polished recovery screen.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md w-full text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8"
            >
              <AlertTriangle className="w-9 h-9 text-red-400" />
            </motion.div>

            {/* Content */}
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              We hit an unexpected error. Try refreshing the page. If the problem
              persists, please contact support.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm transition-all hover:bg-white/90"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-semibold text-sm transition-all hover:bg-white/10"
              >
                <Home className="w-4 h-4" />
                Go Home
              </motion.a>
            </div>

            {/* Error detail (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <summary className="text-xs text-white/30 cursor-pointer select-none">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-3 text-[11px] text-red-400/70 overflow-auto max-h-40 font-mono whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
