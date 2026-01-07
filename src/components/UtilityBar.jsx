import React from "react";
import "../styles/utilityBar.css";

const UtilityBar = ({
  query,
  setQuery,
  sort,
  setSort,
  count = 0,
  onClear = () => setQuery(""),
  onDownload = () => {},
}) => {
  return (
    <div className="utility-bar">
      <div className="ub-left">
        <label className="ub-search">
          <input
            type="search"
            placeholder="Search transcripts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search transcripts"
          />
        </label>
      </div>

      <div className="ub-right">
        <label className="ub-sort">
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort recordings">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <div className="ub-stats">{count} result{count === 1 ? "" : "s"}</div>

        <button className="ub-btn" onClick={onClear} title="Clear search">
          Clear
        </button>

        <button
          className="ub-btn primary"
          onClick={onDownload}
          title="Download visible recordings"
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default UtilityBar;