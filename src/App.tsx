import { useState } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [convertedQuery, setConvertedQuery] = useState('');

  const convertQuery = () => {
    const converted = query
      .split(' ')
      .map(word => {
        if (word.includes(':')) {
          return word;
        }
        return `"${word}"`;
      })
      .join(' ');
    setConvertedQuery(converted);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PoE Search Query Converter</h1>
        <div className="converter-container">
          <textarea
            className="query-input"
            placeholder="検索クエリを入力してください..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            cols={50}
          />
          <button className="convert-button" onClick={convertQuery}>
            変換
          </button>
          {convertedQuery && (
            <div className="result-container">
              <h3>変換結果:</h3>
              <code className="converted-query">{convertedQuery}</code>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
