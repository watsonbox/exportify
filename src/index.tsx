import React from "react"
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import { createRoot } from 'react-dom/client'
import "./index.scss"
import App from "./App"
import reportWebVitals from "./reportWebVitals"
import './i18n/config'

// https://caniuse.com/mdn-javascript_builtins_array_flatmap
require('array.prototype.flatmap').shim()

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
