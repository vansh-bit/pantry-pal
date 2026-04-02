import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CUISINE_EMOJIS = {
  italian: '🍝', indian: '🍛', mexican: '🌮', chinese: '🥡',
  japanese: '🍱', american: '🍔', french: '🥐', thai: '🍜',
  mediterranean: '🫒', default: '🍽️'
};

function getCuisineEmoji(cuisine) {
  if (!cuisine) return '🍽️';
  const key = cuisine.toLowerCase();
  for (const [k, v] of Object.entries(CUISINE_EMOJIS)) {
    if (key.includes(k)) return v;
  }
  return CUISINE_EMOJIS.default;
}

export function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  return (
    <div className="card recipe-card" onClick={() => navigate(`/recipes/${recipe.id}`)}>
      <div className="recipe-card-img">
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          : getCuisineEmoji(recipe.cuisine)
        }
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{recipe.title}</div>
        <div className="recipe-card-meta">
          <span className="recipe-meta-item">🍽️ {recipe.cuisine}</span>
          <span className="recipe-meta-item">⏱ {recipe.prep_time_mins} min</span>
          {recipe.calories && <span className="recipe-meta-item">🔥 {recipe.calories} cal</span>}
          {recipe.avg_rating && (
            <span className="recipe-meta-item">
              ⭐ {recipe.avg_rating} ({recipe.review_count})
            </span>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div className="recipe-card-tags">
            {recipe.tags?.slice(0, 3).map(t => (
              <span key={t.id} className="tag-pill">{t.tag_name}</span>
            ))}
          </div>
          {recipe.approval_status && recipe.approval_status !== 'approved' && (
            <span className={`badge badge-${recipe.approval_status}`}>{recipe.approval_status}</span>
          )}
        </div>
        <div style={{marginTop:8,fontSize:'0.8rem',color:'var(--text-muted)'}}>by {recipe.author_name}</div>
      </div>
    </div>
  );
}

export function StarRating({ value = 0, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={`star ${(hover || value) >= n ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{cursor: readOnly ? 'default' : 'pointer'}}
        >★</span>
      ))}
    </div>
  );
}

export function Toast({ message, type = 'default', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'default') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, addToast, removeToast };
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="recipe-grid">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export function EmptyState({ icon = '🍽️', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {subtitle && <p style={{marginBottom:20}}>{subtitle}</p>}
      {action}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>🥘 <strong>Pantry Pal</strong> — Discover recipes, manage your pantry, cook with joy.</div>
      <div style={{marginTop:6}}>Built with Django REST Framework + React.js</div>
    </footer>
  );
}
