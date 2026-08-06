import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; errorMsg: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMsg: '' }

  static getDerivedStateFromError(error: Error) { return { hasError: true, errorMsg: String(error) } }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center bg-cream-50">
          <p className="text-maroon-700 font-semibold text-lg">Something went wrong</p>
          <p className="text-xs text-gray-500 break-all max-w-xs">{this.state.errorMsg}</p>
          <button
            className="px-4 py-2 bg-maroon-700 text-white rounded-lg text-sm"
            onClick={() => { this.setState({ hasError: false, errorMsg: '' }); window.location.hash = '/' }}
          >
            Go to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
