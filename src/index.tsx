import React from "react"
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import { createRoot } from 'react-dom/client'
import "./index.scss"
import App from "./App"
import './i18n/config'
import { prepareReport } from "./helpers"

Bugsnag.start({
  apiKey: 'a65916528275f084a1754a59797a36b3',
  plugins: [new BugsnagPluginReact()],
  redactedKeys: ['Authorization'],
  releaseStage: import.meta.env.PROD ? 'production' : 'development',
  enabledReleaseStages: ['production', 'staging'],
  onError: prepareReport
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
