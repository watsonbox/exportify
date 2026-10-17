import React from "react"
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import { createRoot } from 'react-dom/client'
import "./index.scss"
import App from "./App"
import './i18n/config'

Bugsnag.start({
  apiKey: 'a65916528275f084a1754a59797a36b3',
  plugins: [new BugsnagPluginReact()],
  redactedKeys: ['Authorization'],
  enabledReleaseStages: ['production', 'staging'],
  onError: function (event) {
    event.request.url = "[REDACTED]" // Don't send access tokens

    if (event.originalError.isAxiosError) {
      event.groupingHash = event.originalError.message
    }
  }
})

const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React)
const container = document.getElementById('root')
const root = createRoot(container!)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
