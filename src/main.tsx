import { render } from 'preact'
import './index.css'
import { App } from './app'

render(<App />, document.getElementById('app')!)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
