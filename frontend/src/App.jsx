
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark, BookmarkCheck, LayoutDashboard, Star, Search, Plus,
  Trash2, ExternalLink, Globe, Folder, Heart, Sparkles, Link2,
  LoaderCircle
} from "lucide-react";

import {
  getBookmarks,
  createBookmark,
  toggleFavorite,
  deleteBookmark
} from "./services/api";

import "./App.css";

function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tag, setTag] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all bookmarks (filtering happens on the client)
  const fetchBookmarks = async () => {
    try {
      const result = await getBookmarks();
      setBookmarks(result.data || []);
      setError("");
    } catch {
      setError("Unable to load bookmarks. Check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Initial loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getBookmarks();
        setBookmarks(result.data || []);
        setError("");
      } catch {
        setError("Unable to load bookmarks. Check your backend server.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Select a category (all categories stay visible)
  const handleTagChange = (newTag) => {
    setSelectedTag(newTag);
    setFavoritesOnly(false);
  };

  // Create bookmark
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      setError("Please enter both title and URL.");
      return;
    }

    if (!/^https?:\/\/.+/i.test(url.trim())) {
      setError("URL must start with http:// or https://");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createBookmark({
        title: title.trim(),
        url: url.trim(),
        tag: tag.trim() || "general"
      });

      setTitle("");
      setUrl("");
      setTag("");
      setSelectedTag("all");
      setFavoritesOnly(false);

      await fetchBookmarks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save bookmark.");
    } finally {
      setSaving(false);
    }
  };

  // Favorite toggle
  const handleFavorite = async (id) => {
    try {
      const result = await toggleFavorite(id);

      setBookmarks((previous) =>
        previous.map((item) =>
          item._id === id ? result.data : item
        )
      );
    } catch {
      setError("Could not update favorite.");
    }
  };

  // Delete bookmark (after confirmation)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteBookmark(deleteTarget._id);

      setBookmarks((previous) =>
        previous.filter((item) => item._id !== deleteTarget._id)
      );
      setDeleteTarget(null);
    } catch {
      setError("Could not delete bookmark.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // Close the confirmation dialog with Escape
  useEffect(() => {
    if (!deleteTarget) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) {
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, deleting]);

  // Search and favorites
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesTag = selectedTag === "all"
        ? true
        : (item.tag || "general") === selectedTag;

      const matchesFavorite = favoritesOnly
        ? item.isFavorite
        : true;

      return matchesSearch && matchesTag && matchesFavorite;
    });
  }, [bookmarks, search, favoritesOnly, selectedTag]);

  const favoriteCount = bookmarks.filter(
    (item) => item.isFavorite
  ).length;

  const categoryCount = new Set(
    bookmarks.map((item) => item.tag || "general")
  ).size;

  const tags = [
    "all",
    ...new Set(bookmarks.map((item) => item.tag || "general"))
  ];

  return (
    <div className="app-container">

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">
              <BookmarkCheck size={22} />
            </div>
            <div>
              <h2>Stash<span>.</span></h2>
              <small>YOUR LINKS, TUCKED AWAY</small>
            </div>
          </div>

          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={`nav-item ${!favoritesOnly ? "active" : ""}`}
              onClick={() => {
                setFavoritesOnly(false);
                handleTagChange("all");
              }}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button
              className={`nav-item ${favoritesOnly ? "active" : ""}`}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
            >
              <Star size={18} />
              Favorites
              <span className="nav-count">{favoriteCount}</span>
            </button>
          </nav>

          <div className="header-actions">
            <span className="online-status">
              <span className="status-dot"></span>
              All systems active
            </span>
            <div className="top-avatar">A</div>
          </div>
        </div>
      </header>

      <main className="main-content">

        <section className="hero">
          <div className="hero-copy">
            <span className="welcome-tag">
              <Sparkles size={14} /> YOUR COZY LINK CORNER
            </span>
            <h1>Keep the <span>good stuff</span> close.</h1>
            <p>
              A calm little corner for the sites you love —
              saved, sorted, and always one click away.
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-icon"><Bookmark size={15} /></span>
                <div><strong>{bookmarks.length}</strong><span>Bookmarks</span></div>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-icon amber"><Star size={15} /></span>
                <div><strong>{favoriteCount}</strong><span>Favorites</span></div>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-icon sage"><Folder size={15} /></span>
                <div><strong>{categoryCount}</strong><span>Categories</span></div>
              </div>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="stack-card card-a">
              <span className="stack-icon"><Globe size={16} /></span>
              <div>
                <strong>Design inspiration</strong>
                <small>dribbble.com</small>
              </div>
            </div>
            <div className="stack-card card-b">
              <span className="stack-icon amber"><Bookmark size={16} /></span>
              <div>
                <strong>Reading list</strong>
                <small>medium.com</small>
              </div>
            </div>
            <div className="stack-card card-c">
              <span className="stack-icon sage"><Star size={16} /></span>
              <div>
                <strong>Favorites</strong>
                <small>github.com</small>
              </div>
            </div>
          </div>
        </section>

        <section className="add-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">BUILD YOUR COLLECTION</span>
              <h2>Add a new bookmark</h2>
            </div>
            <div className="add-heading-icon"><Plus size={22} /></div>
          </div>

          <form onSubmit={handleSubmit} className="bookmark-form">
            <div className="form-field">
              <label htmlFor="bookmark-title">
                <span className="label-index">01</span> Bookmark Title
              </label>
              <input
                id="bookmark-title"
                type="text"
                placeholder="e.g. React Documentation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="bookmark-url">
                <span className="label-index">02</span> Website URL
              </label>
              <input
                id="bookmark-url"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="bookmark-tag">
                <span className="label-index">03</span> Category / Tag
              </label>
              <input
                id="bookmark-tag"
                type="text"
                placeholder="general"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>

            <button className="add-button" type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={18} /> : <Plus size={19} />}
              {saving ? "Saving..." : "Save Bookmark"}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}
        </section>

        <section className="collection-section">
          <div className="collection-heading">
            <div>
              <span className="section-eyebrow">
                COLLECTION / {favoritesOnly
                  ? "FAVORITES"
                  : selectedTag === "all"
                    ? "ALL BOOKMARKS"
                    : selectedTag.toUpperCase()}
              </span>
              <h2>{favoritesOnly ? "Your Favorites" : "Saved Bookmarks"}</h2>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-row">
            {tags.map((item) => (
              <button
                key={item}
                className={`filter-btn ${selectedTag === item ? "selected" : ""}`}
                onClick={() => handleTagChange(item)}
              >
                {item === "all" ? "All Bookmarks" : item}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-state">
              <LoaderCircle className="spin" size={32} />
              <p>Loading your bookmarks...</p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Bookmark size={38} /></div>
              <h3>No bookmarks yet</h3>
              <p>Your collection is waiting! Add your first bookmark using the form above.</p>
            </div>
          ) : (
            <div className="bookmark-grid">
              {filteredBookmarks.map((item) => (
                <article className="bookmark-card" key={item._id}>
                  <div className="card-top">
                    <div className="website-icon"><Globe size={22} /></div>
                    <div className="card-actions">
                      <button
                        className={`icon-button favorite-btn ${item.isFavorite ? "favorited" : ""}`}
                        onClick={() => handleFavorite(item._id)}
                        title="Toggle Favorite"
                      >
                        <Star size={18} fill={item.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button
                        className="icon-button delete-btn"
                        onClick={() => setDeleteTarget(item)}
                        title="Delete Bookmark"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <span className="tag-badge">{item.tag || "general"}</span>
                  <h3>{item.title}</h3>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bookmark-link"
                  >
                    <Link2 size={15} />
                    {item.url}
                    <ExternalLink size={14} />
                  </a>

                  <div className="card-footer">
                    <span><Heart size={14} />{item.isFavorite ? "Favorite" : "Saved"}</span>
                    <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="footer">
          <span>Stash © 2026</span>
          <span>Made for your digital world <Heart size={13} /></span>
        </footer>

      </main>

      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-icon">
              <Trash2 size={26} />
            </div>

            <h3 id="delete-dialog-title">Delete this bookmark?</h3>
            <p>
              <strong>{deleteTarget.title}</strong> will be permanently
              removed from your stash. This can’t be undone.
            </p>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                autoFocus
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? <LoaderCircle className="spin" size={16} />
                  : <Trash2 size={16} />}
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
