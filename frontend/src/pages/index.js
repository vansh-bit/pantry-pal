import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RecipeCard, SkeletonGrid, EmptyState, useToast, ToastContainer } from '../components';

export function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/recipes/my-recipes/').then(r => setRecipes(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? recipes : recipes.filter(r => r.approval_status === filter);

  return (
    <div className="container page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 className="section-title">My Recipes</h1>
          <p className="section-sub">{recipes.length} total recipes</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/recipes/new')}>+ New Recipe</button>
      </div>
      <div className="filter-row" style={{marginTop:0}}>
        {['all','approved','pending','rejected'].map(s => (
          <button key={s} className={`filter-pill ${filter===s?'active':''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase()+s.slice(1)}{s!=='all'&&` (${recipes.filter(r=>r.approval_status===s).length})`}
          </button>
        ))}
      </div>
      {loading ? <SkeletonGrid count={3}/> : filtered.length===0 ? (
        <EmptyState icon="📝" title="No recipes here" subtitle="Start sharing your culinary creations!"
          action={<button className="btn btn-primary" onClick={()=>navigate('/recipes/new')}>+ Add Recipe</button>}/>
      ) : (
        <div className="recipe-grid">{filtered.map(r=><RecipeCard key={r.id} recipe={r}/>)}</div>
      )}
    </div>
  );
}

export function Pantry() {
  const [pantry, setPantry] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiMatches, setAiMatches] = useState([]);
  const [usedAi, setUsedAi] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/pantry/'), api.get('/ingredients/')])
      .then(([p,i]) => { setPantry(p.data.results||p.data); setIngredients(i.data.results||i.data); })
      .finally(() => setLoading(false));
  }, []);

  const addItem = async (ingredient) => {
    setAdding(ingredient.id);
    try {
      await api.post('/pantry/', { ingredient_id: ingredient.id, quantity: '1', unit: 'pieces' });
      const res = await api.get('/pantry/');
      setPantry(res.data.results||res.data);
      addToast(`${ingredient.name} added!`, 'success');
    } catch(e) { addToast(e.response?.data?.non_field_errors?.[0]||'Already in pantry','error'); }
    finally { setAdding(null); }
  };

  const removeItem = async (id) => {
    await api.delete(`/pantry/${id}/`);
    setPantry(p=>p.filter(i=>i.id!==id));
    addToast('Removed from pantry','success');
  };

  const updateQty = async (item, qty, unit) => {
    await api.patch(`/pantry/${item.id}/`, { quantity: qty, unit });
    setPantry(p=>p.map(i=>i.id===item.id?{...i,quantity:qty,unit}:i));
  };

  const findRecipes = () => {
    const names = pantry.map(p=>p.ingredient.name).join(' ');
    navigate(`/search?q=${encodeURIComponent(names)}`);
  };

  const getAiSuggestions = async () => {
    if (!pantry.length) return;
    setAiLoading(true);
    try {
      const res = await api.post('/pantry/ai-suggestions/');
      setAiSummary(res.data.ai_summary || '');
      const local = (res.data.top_matches || []).map(m => ({ ...m, source_type: 'local' }));
      const web = (res.data.web_matches || []).map(m => ({ ...m, source_type: 'web' }));
      setAiMatches([...local, ...web]);
      setUsedAi(Boolean(res.data.generated_with_ai));
      addToast('AI suggestions ready!', 'success');
    } catch (e) {
      addToast(e.response?.data?.error || 'Could not generate suggestions', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) && !pantry.find(p=>p.ingredient.id===i.id)
  ).slice(0,12);

  return (
    <div className="container page">
      <ToastContainer toasts={toasts} removeToast={removeToast}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 className="section-title">🥕 My Pantry</h1>
          <p className="section-sub">{pantry.length} ingredients stocked</p>
        </div>
        {pantry.length>0 && (
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-secondary" onClick={getAiSuggestions} disabled={aiLoading}>
              {aiLoading ? '✨ Thinking...' : '✨ AI Meal Planner'}
            </button>
            <button className="btn btn-green" onClick={findRecipes}>🔍 Find Recipes from My Pantry</button>
          </div>
        )}
      </div>
      {(aiSummary || aiMatches.length > 0) && (
        <div className="card" style={{padding:20,marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <h3 style={{margin:0,fontFamily:"'Playfair Display',serif"}}>AI Pantry Suggestions</h3>
            <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
              {usedAi ? 'AI powered' : 'Smart fallback mode'}
            </span>
          </div>
          {aiSummary && <p style={{marginTop:0,color:'var(--text)'}}>{aiSummary}</p>}
          {aiMatches.length > 0 && (
            <div style={{display:'grid',gap:10}}>
              {aiMatches.map(m => (
                <div key={m.recipe_id} style={{border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 12px',background:'var(--cream)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                    <div>
                      <div style={{fontWeight:700}}>{m.title}</div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>
                        {m.cuisine} · {m.match_count} pantry matches · {m.source_type === 'web' ? 'Web recipe' : 'PantryPal recipe'}
                      </div>
                    </div>
                    {m.source_type === 'web' && m.source_url ? (
                      <a
                        className="btn btn-primary btn-sm"
                        href={m.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Source
                      </a>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/recipes/${m.recipe_id}`)}>
                        Open
                      </button>
                    )}
                  </div>
                  {m.missing_ingredients?.length > 0 && (
                    <div style={{fontSize:'0.8rem',marginTop:8,color:'var(--text-muted)'}}>
                      Missing: {m.missing_ingredients.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'start'}}>
        <div>
          <h3 style={{marginBottom:16,fontFamily:"'Playfair Display',serif"}}>My Pantry Items</h3>
          {loading ? <div className="skeleton" style={{height:200}}/> : pantry.length===0 ? (
            <EmptyState icon="🛒" title="Pantry is empty" subtitle="Add ingredients from the list on the right."/>
          ) : pantry.map(item => (
            <div key={item.id} className="pantry-item">
              <div>
                <div className="pantry-item-name">{item.ingredient.name}</div>
                {item.ingredient.category && <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{item.ingredient.category}</div>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input className="form-input" style={{width:70,padding:'4px 8px',fontSize:'0.85rem'}} defaultValue={item.quantity}
                  onBlur={e=>updateQty(item,e.target.value,item.unit)}/>
                <input className="form-input" style={{width:80,padding:'4px 8px',fontSize:'0.85rem'}} defaultValue={item.unit}
                  onBlur={e=>updateQty(item,item.quantity,e.target.value)}/>
                <button className="btn btn-danger btn-sm" onClick={()=>removeItem(item.id)} style={{padding:'4px 10px'}}>×</button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{marginBottom:16,fontFamily:"'Playfair Display',serif"}}>Add Ingredients</h3>
          <input className="form-input" placeholder="Search ingredients..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
          {filtered.map(i => (
            <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--white)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',marginBottom:8}}>
              <div>
                <div style={{fontWeight:600,fontSize:'0.9rem'}}>{i.name}</div>
                {i.category && <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{i.category}</div>}
              </div>
              <button className="btn btn-primary btn-sm" onClick={()=>addItem(i)} disabled={adding===i.id}>
                {adding===i.id?'...':'+ Add'}
              </button>
            </div>
          ))}
          {search && filtered.length===0 && <p style={{color:'var(--text-muted)',fontSize:'0.9rem',textAlign:'center',padding:16}}>No matching ingredients found.</p>}
        </div>
      </div>
    </div>
  );
}

export function Search() {
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { setQuery(q); doSearch(q); }
    if (user) api.get('/search-history/').then(r=>setHistory(r.data.results||r.data)).catch(()=>{});
  }, []);

  const doSearch = async (q) => {
    setLoading(true); setSearched(true);
    try {
      const res = await api.post('/search/', { query: q });
      setResults(res.data.results||[]);
      if (user) api.get('/search-history/').then(r=>setHistory(r.data.results||r.data)).catch(()=>{});
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query)}`); doSearch(query); }
  };

  const deleteHistory = async (id) => {
    await api.delete(`/search-history/${id}/`);
    setHistory(h=>h.filter(e=>e.id!==id));
  };

  return (
    <div className="container page">
      <h1 className="section-title" style={{marginBottom:20}}>Search Recipes</h1>
      <form style={{display:'flex',gap:0,maxWidth:600,marginBottom:32,background:'var(--white)',borderRadius:'var(--radius-pill)',border:'2px solid var(--orange)',overflow:'hidden',boxShadow:'var(--shadow)'}} onSubmit={handleSearch}>
        <input style={{flex:1,padding:'12px 20px',border:'none',outline:'none',fontFamily:"'Nunito',sans-serif",fontSize:'0.95rem'}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search recipes, ingredients, cuisines..."/>
        <button type="submit" style={{padding:'12px 24px',background:'var(--orange)',color:'var(--white)',border:'none',cursor:'pointer',fontWeight:600,fontFamily:"'Nunito',sans-serif"}}>Search</button>
      </form>
      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:32,alignItems:'start'}}>
        <div>
          {loading ? <SkeletonGrid count={3}/> : searched ? (
            results.length===0 ? (
              <EmptyState icon="🔍" title="No results found" subtitle={`No recipes matched "${query}"`}/>
            ) : (
              <>
                <p className="section-sub">{results.length} results for "{query}"</p>
                <div className="recipe-grid">{results.map(r=><RecipeCard key={r.id} recipe={r}/>)}</div>
              </>
            )
          ) : <EmptyState icon="🔍" title="Start searching" subtitle="Type something above to find recipes"/>}
        </div>
        {user && (
          <div>
            <div style={{fontWeight:700,marginBottom:14,fontFamily:"'Playfair Display',serif"}}>Recent Searches</div>
            {history.length===0 ? (
              <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No search history yet.</p>
            ) : history.slice(0,10).map(h=>(
              <div key={h.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--white)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',marginBottom:8}}>
                <span style={{fontSize:'0.85rem',cursor:'pointer',color:'var(--orange)',fontWeight:500}}
                  onClick={()=>{setQuery(h.search_query);doSearch(h.search_query);}}>
                  🔍 {h.search_query}
                </span>
                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'1rem'}} onClick={()=>deleteHistory(h.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPanel() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const [newIng, setNewIng] = useState({ name:'', category:'' });

  useEffect(() => {
    setLoading(true);
    if (tab==='pending') api.get('/recipes/pending/').then(r=>setPending(r.data.results||r.data)).finally(()=>setLoading(false));
    else if (tab==='ingredients') api.get('/ingredients/').then(r=>setIngredients(r.data.results||r.data)).finally(()=>setLoading(false));
    else setLoading(false);
  }, [tab]);

  const approve = async (id) => {
    await api.post(`/recipes/${id}/approve/`);
    setPending(p=>p.filter(r=>r.id!==id));
    addToast('Recipe approved!','success');
  };
  const reject = async (id) => {
    await api.post(`/recipes/${id}/reject/`);
    setPending(p=>p.filter(r=>r.id!==id));
    addToast('Recipe rejected','error');
  };
  const addIngredient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ingredients/', newIng);
      setIngredients(p=>[...p,res.data]);
      setNewIng({name:'',category:''});
      addToast('Ingredient added!','success');
    } catch(err) { addToast(err.response?.data?.name?.[0]||'Failed to add','error'); }
  };

  return (
    <div className="container page">
      <ToastContainer toasts={toasts} removeToast={removeToast}/>
      <h1 className="section-title" style={{marginBottom:8}}>Admin Panel</h1>
      <p className="section-sub">Manage recipes and ingredients</p>
      <div className="tabs">
        <div className={`tab ${tab==='pending'?'active':''}`} onClick={()=>setTab('pending')}>
          Pending Recipes{pending.length>0?` (${pending.length})`:''}
        </div>
        <div className={`tab ${tab==='ingredients'?'active':''}`} onClick={()=>setTab('ingredients')}>Ingredients</div>
      </div>

      {tab==='pending' && (
        loading ? <SkeletonGrid count={3}/> : pending.length===0 ? (
          <EmptyState icon="✅" title="All caught up!" subtitle="No pending recipes to review."/>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {pending.map(r=>(
              <div key={r.id} className="card" style={{padding:20,display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.1rem',marginBottom:4}}>{r.title}</div>
                  <div style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>by {r.author_name} · {r.cuisine} · {r.prep_time_mins} min</div>
                  <div style={{marginTop:6,display:'flex',gap:6}}>{r.tags?.map(t=><span key={t.id} className="tag-pill">{t.tag_name}</span>)}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <a href={`/recipes/${r.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Preview</a>
                  <button className="btn btn-green btn-sm" onClick={()=>approve(r.id)}>✓ Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>reject(r.id)}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab==='ingredients' && (
        <div>
          <div className="card" style={{padding:20,marginBottom:24}}>
            <div style={{fontWeight:700,marginBottom:14}}>Add New Ingredient</div>
            <form onSubmit={addIngredient} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:12,alignItems:'end'}}>
              <div>
                <label className="form-label">Name *</label>
                <input className="form-input" value={newIng.name} onChange={e=>setNewIng(p=>({...p,name:e.target.value}))} placeholder="e.g. Mozzarella" required/>
              </div>
              <div>
                <label className="form-label">Category</label>
                <input className="form-input" value={newIng.category} onChange={e=>setNewIng(p=>({...p,category:e.target.value}))} placeholder="e.g. Dairy"/>
              </div>
              <button className="btn btn-primary" type="submit">Add</button>
            </form>
          </div>
          <div className="card" style={{overflow:'hidden'}}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Category</th></tr></thead>
              <tbody>
                {ingredients.map(i=>(
                  <tr key={i.id}><td style={{fontWeight:500}}>{i.name}</td><td style={{color:'var(--text-muted)'}}>{i.category||'—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
