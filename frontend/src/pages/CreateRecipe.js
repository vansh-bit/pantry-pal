import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useToast, ToastContainer } from '../components';

const STEPS = ['Basic Info', 'Ingredients', 'Tags & Submit'];

export default function CreateRecipe() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [allIngredients, setAllIngredients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const [form, setForm] = useState({
    title: '', instructions: '', cuisine: '', prep_time_mins: '', calories: '', image_url: '',
    recipe_ingredients: [], tag_ids: []
  });
  const [errors, setErrors] = useState({});

  const firstErrorMessage = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      const first = data.find(Boolean);
      return typeof first === 'string' ? first : firstErrorMessage(first);
    }
    if (typeof data === 'object') {
      for (const key of Object.keys(data)) {
        const msg = firstErrorMessage(data[key]);
        if (msg) return msg;
      }
    }
    return '';
  };

  useEffect(() => {
    api.get('/ingredients/?search=').then(r => setAllIngredients(r.data.results || r.data)).catch(()=>{});
    api.get('/tags/').then(r => setAllTags(r.data.results || r.data)).catch(()=>{});
    if (isEdit) {
      api.get(`/recipes/${id}/`).then(r => {
        const d = r.data;
        setForm({
          title: d.title, instructions: d.instructions, cuisine: d.cuisine,
          prep_time_mins: d.prep_time_mins, calories: d.calories || '',
          image_url: d.image_url || '',
          recipe_ingredients: d.recipe_ingredients?.map(ri => ({
            ingredient_id: ri.ingredient?.id, ingredient_name: ri.ingredient?.name,
            quantity_required: ri.quantity_required, ri_unit: ri.ri_unit, ri_notes: ri.ri_notes || ''
          })) || [],
          tag_ids: d.tags?.map(t => t.id) || []
        });
      });
    }
  }, [id]);

  useEffect(() => {
    const q = ingredientSearch.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get('/ingredients/', { params: { search: q } })
        .then(r => setSearchResults(r.data.results || r.data))
        .catch(() => setSearchResults([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [ingredientSearch]);

  const setField = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: ''})); };

  const validateStep0 = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.cuisine.trim()) e.cuisine = 'Cuisine is required';
    if (!form.prep_time_mins) e.prep_time_mins = 'Prep time is required';
    if (!form.instructions.trim()) e.instructions = 'Instructions are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addIngredient = (ing) => {
    if (form.recipe_ingredients.find(r => r.ingredient_id === ing.id)) return;
    setForm(p => ({...p, recipe_ingredients: [...p.recipe_ingredients, {
      ingredient_id: ing.id, ingredient_name: ing.name,
      quantity_required: '1', ri_unit: 'cups', ri_notes: ''
    }]}));
    setIngredientSearch('');
  };

  const removeIngredient = (idx) => setForm(p => ({...p, recipe_ingredients: p.recipe_ingredients.filter((_,i) => i !== idx)}));
  const updateIngredient = (idx, field, val) => setForm(p => ({...p, recipe_ingredients: p.recipe_ingredients.map((r,i) => i === idx ? {...r, [field]: val} : r)}));
  const toggleTag = (tagId) => setForm(p => ({...p, tag_ids: p.tag_ids.includes(tagId) ? p.tag_ids.filter(t => t !== tagId) : [...p.tag_ids, tagId]}));

  const handleSubmit = async () => {
    const invalidRow = form.recipe_ingredients.find(
      (ri) => !ri.ingredient_id || !String(ri.quantity_required || '').trim() || !String(ri.ri_unit || '').trim()
    );
    if (invalidRow) {
      addToast(`Please fill amount and unit for ${invalidRow.ingredient_name || 'all ingredients'}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        prep_time_mins: parseInt(form.prep_time_mins),
        calories: form.calories ? parseInt(form.calories) : null,
        recipe_ingredients: form.recipe_ingredients.map(({ingredient_id, quantity_required, ri_unit, ri_notes}) => ({ingredient_id, quantity_required, ri_unit, ri_notes}))
      };
      if (isEdit) {
        await api.patch(`/recipes/${id}/`, payload);
        addToast('Recipe updated!', 'success');
        setTimeout(() => navigate(`/recipes/${id}`), 1000);
      } else {
        await api.post('/recipes/', payload);
        addToast('Recipe submitted for approval!', 'success');
        setTimeout(() => navigate('/my-recipes'), 1500);
      }
    } catch (err) {
      const data = err.response?.data;
      const message = data?.detail || data?.error || firstErrorMessage(data) || 'Could not save recipe';
      addToast(message, 'error');
    } finally { setSubmitting(false); }
  };

  const sourceIngredients = ingredientSearch.trim() ? searchResults : allIngredients;
  const filteredIngredients = sourceIngredients.filter(i =>
    !form.recipe_ingredients.find(r => r.ingredient_id === i.id)
  ).slice(0, 8);

  return (
    <div className="container page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div style={{maxWidth:720,margin:'0 auto'}}>
        <h1 style={{marginBottom:8}}>{isEdit ? 'Edit Recipe' : 'Share a Recipe'}</h1>
        <p style={{color:'var(--text-muted)',marginBottom:32}}>
          {isEdit ? 'Update your recipe details' : 'Your recipe will be reviewed before going public'}
        </p>

        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="step-num">{i < step ? '✓' : i + 1}</div>
                <div className="step-label">{s}</div>
              </div>
              {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="card" style={{padding:28}}>
          {step === 0 && (
            <div>
              <div className="form-group">
                <label className="form-label">Recipe Title *</label>
                <input className={`form-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Grandma's Spaghetti" />
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div className="form-group">
                  <label className="form-label">Cuisine *</label>
                  <input className={`form-input ${errors.cuisine ? 'error' : ''}`} value={form.cuisine} onChange={e => setField('cuisine', e.target.value)} placeholder="e.g. Italian" />
                  {errors.cuisine && <div className="form-error">{errors.cuisine}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Prep Time (minutes) *</label>
                  <input type="number" className={`form-input ${errors.prep_time_mins ? 'error' : ''}`} value={form.prep_time_mins} onChange={e => setField('prep_time_mins', e.target.value)} placeholder="30" min="1" />
                  {errors.prep_time_mins && <div className="form-error">{errors.prep_time_mins}</div>}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div className="form-group">
                  <label className="form-label">Calories (optional)</label>
                  <input type="number" className="form-input" value={form.calories} onChange={e => setField('calories', e.target.value)} placeholder="450" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL (optional)</label>
                  <input className="form-input" value={form.image_url} onChange={e => setField('image_url', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Instructions *</label>
                <textarea className={`form-input ${errors.instructions ? 'error' : ''}`} value={form.instructions} onChange={e => setField('instructions', e.target.value)} placeholder="Step 1: ..." rows={6} />
                {errors.instructions && <div className="form-error">{errors.instructions}</div>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{fontWeight:600,marginBottom:16}}>Search & add ingredients</div>
              <div style={{position:'relative',marginBottom:20}}>
                <input className="form-input" placeholder="Search ingredients..." value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} />
                {ingredientSearch && filteredIngredients.length > 0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--white)',border:'2px solid var(--border)',borderRadius:'var(--radius-sm)',zIndex:10,boxShadow:'var(--shadow)'}}>
                    {filteredIngredients.map(i => (
                      <div key={i.id} onClick={() => addIngredient(i)} style={{padding:'10px 14px',cursor:'pointer',fontSize:'0.9rem',borderBottom:'1px solid var(--border)'}} onMouseEnter={e => e.target.style.background='var(--cream)'} onMouseLeave={e => e.target.style.background='transparent'}>
                        {i.name} <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>({i.category})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.recipe_ingredients.length === 0 ? (
                <div style={{color:'var(--text-muted)',textAlign:'center',padding:'24px 0',fontSize:'0.9rem'}}>
                  No ingredients added yet. Search above to add.
                </div>
              ) : (
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 100px 100px 80px 32px',gap:8,marginBottom:8,fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',padding:'0 10px'}}>
                    <span>Ingredient</span><span>Amount</span><span>Unit</span><span>Notes</span><span></span>
                  </div>
                  {form.recipe_ingredients.map((ri, i) => (
                    <div key={i} className="ingredient-row" style={{gridTemplateColumns:'1fr 100px 100px 80px 32px'}}>
                      <span style={{fontWeight:600,fontSize:'0.9rem'}}>{ri.ingredient_name}</span>
                      <input className="form-input" style={{padding:'6px 8px',fontSize:'0.85rem'}} value={ri.quantity_required} onChange={e => updateIngredient(i, 'quantity_required', e.target.value)} placeholder="2" />
                      <input className="form-input" style={{padding:'6px 8px',fontSize:'0.85rem'}} value={ri.ri_unit} onChange={e => updateIngredient(i, 'ri_unit', e.target.value)} placeholder="cups" />
                      <input className="form-input" style={{padding:'6px 8px',fontSize:'0.85rem'}} value={ri.ri_notes} onChange={e => updateIngredient(i, 'ri_notes', e.target.value)} placeholder="chopped" />
                      <button className="btn btn-danger btn-sm" style={{padding:'4px 8px'}} onClick={() => removeIngredient(i)}>×</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{fontWeight:600,marginBottom:12}}>Select Tags</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:28}}>
                {allTags.map(t => (
                  <button key={t.id} onClick={() => toggleTag(t.id)}
                    className={`filter-pill ${form.tag_ids.includes(t.id) ? 'active' : ''}`}>
                    {t.tag_name}
                  </button>
                ))}
                {allTags.length === 0 && <span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>No tags available</span>}
              </div>
              <div style={{background:'var(--cream)',borderRadius:'var(--radius-sm)',padding:20}}>
                <div style={{fontWeight:700,marginBottom:8}}>Recipe Summary</div>
                <div style={{fontSize:'0.9rem',color:'var(--text-muted)',lineHeight:2}}>
                  <div><strong>Title:</strong> {form.title}</div>
                  <div><strong>Cuisine:</strong> {form.cuisine} · <strong>Prep:</strong> {form.prep_time_mins} min</div>
                  <div><strong>Ingredients:</strong> {form.recipe_ingredients.length} added</div>
                  <div><strong>Tags:</strong> {form.tag_ids.length} selected</div>
                </div>
                {!isEdit && <div style={{marginTop:12,color:'var(--orange)',fontWeight:600,fontSize:'0.85rem'}}>⚠️ Your recipe will be reviewed by an admin before appearing publicly.</div>}
              </div>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'space-between',marginTop:28}}>
            <button className="btn btn-secondary" onClick={() => step === 0 ? navigate(-1) : setStep(p => p - 1)}>
              {step === 0 ? 'Cancel' : '← Back'}
            </button>
            {step < 2 ? (
              <button className="btn btn-primary" onClick={() => { if (step === 0 && !validateStep0()) return; setStep(p => p + 1); }}>
                Next →
              </button>
            ) : (
              <button className="btn btn-green" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? '✓ Save Changes' : '✓ Submit Recipe'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
