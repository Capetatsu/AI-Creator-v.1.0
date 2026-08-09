import { useEffect, useState, useCallback } from "react";
import { fetchAgentFeed } from "./api/fetchFeed.js";
import { TEMP_AGENT_ID, AGENT_DISPLAY_INFO } from "./constants.js";
import AgentStatus from "./components/AgentStatus.jsx";
import PostFeed from "./components/PostFeed.jsx";
import LoadingState from "./components/LoadingState.jsx";
import EmptyState from "./components/EmptyState.jsx";
import ErrorState from "./components/ErrorState.jsx";
import { IconBolt } from "./components/icons.jsx";

// "loading" | "success" | "error"
export default function App() {
  const [status, setStatus] = useState("loading");
  const [posts, setPosts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const loadFeed = useCallback(() => {
    setStatus("loading");
    setErrorMessage("");

    fetchAgentFeed(TEMP_AGENT_ID)
      .then((data) => {
        setPosts(data.posts || []);
        setStatus("success");
      })
      .catch((error) => {
        setErrorMessage(error.message || "Something went wrong.");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav__brand">
          <span className="topnav__logo">
            <IconBolt width={16} height={16} />
          </span>
          Autonomous AI Creator
        </div>
        <span className="topnav__badge">Hackathon Demo</span>
      </nav>

      <header className="hero">
        <span className="hero__eyebrow">AI Content Agent</span>
        <h1>Your agent's content, live</h1>
        <p className="hero__subtitle">
          Track what your autonomous AI agent is publishing, and see exactly
          why it chose each post.
        </p>
      </header>

      <AgentStatus
        name={AGENT_DISPLAY_INFO.name}
        domain={AGENT_DISPLAY_INFO.domain}
        autonomous={AGENT_DISPLAY_INFO.autonomous}
        postCount={posts.length}
      />

      <main className="page__main">
        <div className="section-heading">
          <h2>Recent posts</h2>
          {status === "success" && posts.length > 0 && (
            <span className="section-heading__hint">Newest first</span>
          )}
        </div>

        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <ErrorState message={errorMessage} onRetry={loadFeed} />
        )}
        {status === "success" && posts.length === 0 && <EmptyState />}
        {status === "success" && posts.length > 0 && <PostFeed posts={posts} />}
      </main>
    </div>
  );
}
