import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RecipeCard, SkeletonGrid, EmptyState } from '../components';

const CUISINES = ['All', 'Italian', 'Indian', 'Mexican', 'Chinese', 'Japanese', 'American', 'French', 'Thai', 'Mediterranean'];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipes();
  }, [cuisine]);

  const fetchRecipes = async (searchQuery = '') => {
    setLoading(true);
    try {
      const params = {};
      if (cuisine !== 'All') params.cuisine = cuisine;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/recipes/', { params });
      setRecipes(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return fetchRecipes();
    navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <>
      <div className="hero">
        <h1>What's in your pantry?</h1>
        <p>Discover delicious recipes, manage your ingredients, and cook with confidence.</p>
        <form className="hero-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search recipes, ingredients, cuisines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        {user && (
          <p style={{marginTop:16,color:'var(--orange)',fontWeight:600}}>
            Welcome back, {user.full_name}! 👋
          </p>
        )}
      </div>

      <div className="container page" style={{paddingTop:24}}>
        <div className="filter-row">
          {CUISINES.map(c => (
            <button
              key={c}
              className={`filter-pill ${cuisine === c ? 'active' : ''}`}
              onClick={() => setCuisine(c)}
            >{c}</button>
          ))}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <div className="section-title">
              {cuisine === 'All' ? 'All Recipes' : `${cuisine} Recipes`}
            </div>
            {!loading && <div className="section-sub">{recipes.length} recipes found</div>}
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : recipes.length === 0 ? (
          <EmptyState
            icon="🍳"
            title="No recipes yet"
            subtitle="Be the first to share a recipe!"
            action={user && (
              <button className="btn btn-primary" onClick={() => navigate('/recipes/new')}>
                + Add Recipe
              </button>
            )}
          />
        ) : (
          <div className="recipe-grid">
            {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        )}
      </div>
    </>
  );
}
