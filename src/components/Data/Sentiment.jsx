
const Sentiment = ({ data, onSelect }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="sentiment-card thinking">
        <div className="sentiment-emoji">🤔</div>
        <p className="sentiment-status">Analyzing subreddit mood...</p>
      </div>
    );
  }

  const total = Object.values(data).reduce((acc, val) => acc + val, 0);
  const config = {
    Positive: { emoji: "😊", color: "#4ade80", label: "Positive" },
    Neutral: { emoji: "😐", color: "#94a3b8", label: "Neutral" },
    Negative: { emoji: "😠", color: "#f87171", label: "Negative" },
  };

  console.log(data)

  return (
    <div className="sentiment-container">
      <h2 className="section-title">Public Sentiment (Click to Filter)</h2>
      <div className="sentiment-grid">
        {Object.entries(data).map(([type, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          const { emoji, color, label } = config[type] || config.Neutral;

          return (
            <div 
              key={type} 
              className="sentiment-card clickable" 
              style={{ borderColor: color, cursor: 'pointer' }}
              onClick={() => onSelect(type)}
            >
              <div className="sentiment-main">
                <span className="sentiment-emoji">{emoji}</span>
                <span className="sentiment-label">{label}</span>
              </div>
              <div className="sentiment-stats">
                <span className="sentiment-percentage">{percentage}%</span>
                <span className="sentiment-count">({count} posts)</span>
              </div>
              <div className="sentiment-bar-bg">
                <div 
                  className="sentiment-bar-fill" 
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                ></div>
              </div>
            </div>
          );
        })}
        <button className="step-btn" style={{ marginTop: '10px', width: '100%' }} onClick={() => onSelect(null)}>
          Show All Posts
        </button>
      </div>
    </div>
  );
};

export default Sentiment;