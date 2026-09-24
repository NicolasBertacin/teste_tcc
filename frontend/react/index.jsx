/**
 * index.jsx
 * Ponto de montagem raiz React 18 no elemento #root.
 */

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
