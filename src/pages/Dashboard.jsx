// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { seedMockData } from '../utils/mockData';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [discoveryEvents, setDiscoveryEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'discovery'
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!user) return;

    // My Events Query
    const qMy = query(
      collection(db, 'events'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeMy = onSnapshot(qMy, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error in My Events listener:", err);
      setError(err.message);
      setLoading(false);
    });

    // Discovery Query (All Events)
    const qDiscovery = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeDiscovery = onSnapshot(qDiscovery, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiscoveryEvents(eventData);
    }, (err) => {
      console.error("Error in Discovery listener:", err);
    });

    return () => {
      unsubscribeMy();
      unsubscribeDiscovery();
    };
  }, [user]);

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
      } catch (error) {
        console.error("Error deleting event:", error);
        alert('Error deleting event.');
      }
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedMockData(user.uid, user.displayName);
    setSeeding(false);
    alert('Mock events added!');
  };

  const handleWipe = async () => {
    if (!window.confirm("🚨 CRITICAL: This will permanently delete ALL events, signups, and requests you have created. This cannot be undone. Proceed?")) {
      return;
    }

    setSeeding(true);
    try {
      // 1. Get all events created by this user
      const q = query(collection(db, 'events'), where('createdBy', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      for (const eventDoc of querySnapshot.docs) {
        const eventId = eventDoc.id;
        
        // 2. Delete sub-collections first (Signups)
        const signupsSnap = await getDocs(collection(db, 'events', eventId, 'signups'));
        for (const sDoc of signupsSnap.docs) {
          await deleteDoc(sDoc.ref);
        }
        
        // 3. Delete sub-collections (Requests)
        const requestsSnap = await getDocs(collection(db, 'events', eventId, 'requests'));
        for (const rDoc of requestsSnap.docs) {
          await deleteDoc(rDoc.ref);
        }
        
        // 4. Delete the event itself
        await deleteDoc(eventDoc.ref);
      }
      alert('Your data has been wiped clean.');
    } catch (error) {
      console.error("Error wiping data:", error);
      alert('Wipe failed. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  const renderEventCard = (event, isOwner) => (
    <div key={event.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.7rem', background: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>
            {event.grade || 'All School'}
          </span>
          <h3 style={{ marginTop: '0.5rem' }}>{event.name}</h3>
          {event.teacher && <p className="muted" style={{ fontSize: '0.8rem' }}>{event.teacher}</p>}
        </div>
        {isOwner && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/edit-event/${event.id}`}>
              <button className="btn-secondary" style={{ padding: '0.4rem', fontSize: '1rem' }}>✏️</button>
            </Link>
            <button className="btn-danger" style={{ padding: '0.4rem', fontSize: '1rem' }} onClick={() => handleDelete(event.id)}>🗑️</button>
          </div>
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          {event.needs?.length || 0} items needed
        </p>
      </div>
      <Link to={`/event/${event.id}`}>
        <button className="btn-secondary" style={{ width: '100%' }}>View Details</button>
      </Link>
    </div>
  );

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back, {user?.displayName}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn-secondary" 
            style={{ color: '#ef4444', fontSize: '0.8rem', border: 'none', background: 'transparent', padding: '0.5rem' }} 
            onClick={handleWipe} 
            disabled={seeding}
          >
            🗑️ Wipe My Data
          </button>
          <button className="btn-secondary" onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Seeding...' : '🌱 Seed Demo'}
          </button>
          <button 
            className="btn-primary" 
            style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none' }}
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('my')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'my' ? 'var(--primary)' : 'var(--text-muted)', 
              fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem', borderBottom: activeTab === 'my' ? '2px solid var(--primary)' : 'none',
              paddingBottom: '1.1rem', marginBottom: '-1.1rem'
            }}
          >
            My Events
          </button>
          <button 
            onClick={() => setActiveTab('discovery')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'discovery' ? 'var(--primary)' : 'var(--text-muted)', 
              fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem', borderBottom: activeTab === 'discovery' ? '2px solid var(--primary)' : 'none',
              paddingBottom: '1.1rem', marginBottom: '-1.1rem'
            }}
          >
            Discover
          </button>
        </div>
        
        <Link to="/create-event" style={{ width: '100%', maxWidth: 'max-content' }}>
          <button className="btn-primary" style={{ width: '100%' }}>+ Create New Event</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p className="muted">Loading events...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid #ef4444' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Database Setup Required</h3>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            It looks like a Firestore Index is missing. Click the link below to create it automatically in your Firebase Console:
          </p>
          <a 
            href={error.includes('https://') ? 'https://' + error.split('https://')[1].split(' ')[0] : '#'} 
            target="_blank" 
            rel="noreferrer"
            className="btn-primary"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Create Firestore Index
          </a>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem' }} className="muted">
            Error: {error}
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'my' ? (
            events.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <span style={{ fontSize: '3rem' }}>🗓️</span>
                  <h2>No events yet</h2>
                  <p className="muted">Events you create will show up here.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {events.map(event => renderEventCard(event, true))}
              </div>
            )
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {discoveryEvents.map(event => renderEventCard(event, event.createdBy === user.uid))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
