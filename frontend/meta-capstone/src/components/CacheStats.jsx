import { useState, useEffect } from "react";
import "../styles/CacheStats.css";
import Loading from "./home_components/Loading";

function CacheStats () {

	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isVisible, setIsVisible] = useState(true);

	const fetchStats = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`${import.meta.env.VITE_BASE_URL}/cache-stats`,
				{ credentials: "include" }
			);
			if (!response.ok) {
				throw new Error("Failed to fetch cache stats");
			}
			const data = await response.json();
			setStats(data);
			setError(null);
		} catch (err) {
			setError(err.message);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchStats();
	}, []);

	return isVisible ? (
		<div className="cache-stats-container">
			<button
				className="hide-button"
				onClick={() => setIsVisible(false)}
				aria-label="Hide cache stats">
				✕
			</button>
			<h3>cache stats</h3>

			{loading && <Loading />}
			{error && <p className="error">Error: {error}</p>}

			{stats && !loading && (
				<div className="stats-grid">
					<div className="stat-item">
						<p className="stat-label">potential api calls:</p>
						<p className="stat-value">{stats.potentialAPICalls}</p>
					</div>
					<div className="stat-item">
						<p className="stat-label">actual api calls:</p>
						<p className="stat-value">{stats.actualAPICalls}</p>
					</div>
					<div className="stat-item">
						<p className="stat-label">local cache hits:</p>
						<p className="stat-value">{stats.cacheHits}</p>
					</div>
					<div className="stat-item">
						<p className="stat-label">db cache hits:</p>
						<p className="stat-value">{stats.DBHits}</p>
					</div>
					<div className="stat-item">
						<p className="stat-label">local cache hit rate:</p>
						<p className="stat-value">
						{stats.potentialAPICalls > 0
							? `${(
								(stats.cacheHits / stats.potentialAPICalls) *
								100
							).toFixed(1)}%` // Round to 1 decimal place
							: "0%"}
						</p>
					</div>
				</div>
			)}

			<button className="refresh-button" onClick={fetchStats} disabled={loading}>refresh</button>
		</div> )
		: (
			<button className="show-stats-button" onClick={() => setIsVisible(true)}>
				show cache stats
			</button>
		);
};

export default CacheStats;
