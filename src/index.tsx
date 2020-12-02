import React from "react"
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import ReactDOM from "react-dom"
import "./index.scss"
import App from "./App"
import reportWebVitals from "./reportWebVitals"

Bugsnag.start({
  apiKey: 'a65916528275f084a1754a59797a36b3',
  plugins: [new BugsnagPluginReact()],
  redactedKeys: ['Authorization'],
  enabledReleaseStages: [ 'production', 'staging' ],
  onError: function (event) {
    event.request.url = "[REDACTED]" // Don't send access tokens

    if (event.originalError.isAxiosError) {
      event.groupingHash = event.originalError.message
    }
  }
})

const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React)

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
