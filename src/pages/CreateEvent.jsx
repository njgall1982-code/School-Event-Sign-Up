// src/pages/CreateEvent.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState('');
  const [grade, setGrade] = useState('All School');
  const [teacher, setTeacher] = useState('');
  const [signupMode, setSignupMode] = useState('instant'); // 'instant' or 'fair'
  const [maxItemsPerUser, setMaxItemsPerUser] = useState(1);
  const [needs, setNeeds] = useState([
    { id: crypto.randomUUID(), title: '', quantity: 1, unit: 'items' }
  ]);

  const grades = [
    'All School', 'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', 
    '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade'
  ];

  const addNeed = () => {
    setNeeds([...needs, { id: crypto.randomUUID(), title: '', quantity: 1, unit: 'items' }]);
  };

  const removeNeed = (index) => {
    const newNeeds = needs.filter((_, i) => i !== index);
    setNeeds(newNeeds);
  };

  const updateNeed = (index, field, value) => {
    const newNeeds = [...needs];
    newNeeds[index][field] = value;
    setNeeds(newNeeds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) return alert('Please enter an event name');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'events'), {
        name: eventName,
        grade: grade,
        teacher: teacher,
        signupMode: signupMode,
        maxItemsPerUser: maxItemsPerUser,
        createdBy: user.uid,
        creatorName: user.displayName,
        createdAt: serverTimestamp(),
        needs: needs.filter(n => n.title.trim() !== ''), // Only save non-empty needs
      });
      navigate('/dashboard');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Error creating event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '3rem' }}>
        <Link to="/dashboard" className="muted" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Back to Dashboard
        </Link>
        <h1>Create New Event</h1>
        <p className="muted">Define what you need for your upcoming school event.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Event Name</label>
            <input 
              type="text" 
              placeholder="e.g., Spring Bake Sale" 
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Teacher (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., Mrs. Smith" 
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Signup Mode</label>
            <select value={signupMode} onChange={(e) => setSignupMode(e.target.value)}>
              <option value="instant">Instant (First-Come, First-Served)</option>
              <option value="fair">Fair (Request & Allocate)</option>
            </select>
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {signupMode === 'instant' ? 'Parents claim spots immediately.' : 'Parents submit ranked requests, and you allocate fairly later.'}
            </p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Max Spots per Volunteer</label>
            <input 
              type="number" 
              min="1" 
              value={maxItemsPerUser} 
              onChange={(e) => setMaxItemsPerUser(parseInt(e.target.value) || 1)} 
            />
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Limits how many total items one person can be assigned.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <label>Needs & Supplies</label>
          <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            List the items, people, or funds required for this event.
          </p>

          {needs.map((need, index) => (
            <div key={index} className="need-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.7rem' }}>Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Paper Plates" 
                  value={need.title}
                  onChange={(e) => updateNeed(index, 'title', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.7rem' }}>Qty</label>
                <div className="qty-control">
                  <button 
                    type="button" 
                    onClick={() => updateNeed(index, 'quantity', Math.max(1, need.quantity - 1))}
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    min="1"
                    value={need.quantity}
                    onChange={(e) => updateNeed(index, 'quantity', parseInt(e.target.value) || 1)}
                    onFocus={(e) => e.target.select()}
                  />
                  <button 
                    type="button" 
                    onClick={() => updateNeed(index, 'quantity', need.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.7rem' }}>Unit</label>
                <select 
                  value={need.unit}
                  onChange={(e) => updateNeed(index, 'unit', e.target.value)}
                >
                  <option value="items">items</option>
                  <option value="people">people</option>
                  <option value="money">dollars ($)</option>
                  <option value="boxes">boxes</option>
                  <option value="plates">plates</option>
                </select>
              </div>
              <button 
                type="button" 
                className="btn-danger"
                onClick={() => removeNeed(index)}
                disabled={needs.length === 1}
              >
                🗑️
              </button>
            </div>
          ))}

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={addNeed}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            + Add Another Need
          </button>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ flex: 1 }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
