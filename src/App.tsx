import { useState } from "react";
import "./App.css";
import { PoeConverter } from "./lib/poeConverter";
import { League } from "./types/league";
import leaguesData from "../data/leagues.json";

function App() {
  const [itemText, setItemText] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultQuery, setResultQuery] = useState<object | null>(null);
  const [error, setError] = useState("");
  const [selectedRealm, setSelectedRealm] = useState<"pc" | "xbox" | "sony">("pc");
  const [selectedLeague, setSelectedLeague] = useState("Mercenaries");
  const [showSupportedItems, setShowSupportedItems] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const converter = new PoeConverter();
  const leagues = leaguesData.result as League[];
  const realmLeagues = leagues.filter((league) => league.realm === selectedRealm);

  const convertItem = () => {
    try {
      setError("");
      const url = converter.convertToTradeUrl(itemText, selectedLeague);
      const query = converter.convertToQuery(itemText);
      setResultUrl(url);
      setResultQuery(query);
    } catch (err) {
      setError("Error during conversion: " + (err as Error).message);
      setResultUrl("");
      setResultQuery(null);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">PoE Search Query Generator</h1>
        
        <div className="accordion">
          <button 
            className="accordion-header"
            onClick={() => setShowSupportedItems(!showSupportedItems)}
          >
            <span>Supported Items</span>
            <span className="accordion-icon">{showSupportedItems ? '−' : '+'}</span>
          </button>
          {showSupportedItems && (
            <div className="accordion-content">
              <div className="supported-items-grid">
                <span>Unique Items</span>
                <span>Cluster Jewels</span>
                <span>Watcher's Eye</span>
                <span>Forbidden Flesh/Flame</span>
                <span>Impossible Escape</span>
                <span>The Balance of Terror</span>
                <span>Sublime Vision</span>
                <span>Split Personality</span>
                <span>Megalomaniac</span>
                <span>The Light of Meaning</span>
              </div>
            </div>
          )}
        </div>

        <div className="input-section">
          <div className="league-selectors">
            <select 
              className="select"
              value={selectedRealm} 
              onChange={(e) => setSelectedRealm(e.target.value as "pc" | "xbox" | "sony")}
            >
              <option value="pc">PC</option>
              <option value="xbox">Xbox</option>
              <option value="sony">PlayStation</option>
            </select>
            
            <select 
              className="select"
              value={selectedLeague} 
              onChange={(e) => setSelectedLeague(e.target.value)}
            >
              {realmLeagues.map((league) => (
                <option key={`${league.realm}-${league.id}`} value={league.id}>
                  {league.text}
                </option>
              ))}
            </select>
          </div>
          
          <textarea
            className="item-input"
            placeholder="Paste PoE item text here (Ctrl+C in game)..."
            value={itemText}
            onChange={(e) => setItemText(e.target.value)}
            rows={12}
          />
          
          <button 
            className="convert-button"
            onClick={convertItem}
            disabled={!itemText.trim()}
          >
            Generate
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </div>

        {resultUrl && (
          <div className="result-section">
            <div className="url-section">
              <h3>URL</h3>
              <div className="url-container">
                <a 
                  href={resultUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="trade-url"
                >
                  {resultUrl}
                </a>
              </div>
            </div>

            <div className="accordion">
              <button 
                className="accordion-header"
                onClick={() => setShowJson(!showJson)}
              >
                <span>JSON</span>
                <span className="accordion-icon">{showJson ? '−' : '+'}</span>
              </button>
              {showJson && (
                <div className="accordion-content">
                  <pre className="json-output">{JSON.stringify(resultQuery, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
