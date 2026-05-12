// src/utils/mockData.js
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MOCK_EVENTS = [
  {
    name: "Spring Book Fair",
    grade: "All School",
    teacher: "Library Staff",
    needs: [
      { id: "m1", title: "Cashier Volunteers", quantity: 4, unit: "people" },
      { id: "m2", title: "Book Shelvers", quantity: 6, unit: "people" },
      { id: "m3", title: "Bottled Water", quantity: 48, unit: "items" }
    ]
  },
  {
    name: "Pizza Friday - 1st Grade",
    grade: "1st Grade",
    teacher: "Mrs. Thompson",
    needs: [
      { id: "m4", title: "Large Cheese Pizzas", quantity: 5, unit: "items" },
      { id: "m5", title: "Napkins", quantity: 100, unit: "items" },
      { id: "m6", title: "Juice Boxes", quantity: 30, unit: "items" }
    ]
  },
  {
    name: "Field Day Setup",
    grade: "All School",
    teacher: "Coach Miller",
    needs: [
      { id: "m7", title: "Orange Cones", quantity: 20, unit: "items" },
      { id: "m8", title: "Water Station Volunteers", quantity: 10, unit: "people" },
      { id: "m9", title: "Sunscreen Bottles", quantity: 5, unit: "items" }
    ]
  },
  {
    name: "Science Fair Judging",
    grade: "5th Grade",
    teacher: "Mr. Henderson",
    needs: [
      { id: "m10", title: "Expert Judges", quantity: 8, unit: "people" },
      { id: "m11", title: "Clipboards", quantity: 10, unit: "items" }
    ]
  },
  {
    name: "Fall Harvest Festival",
    grade: "All School",
    teacher: "PTA Board",
    signupMode: "fair",
    maxItemsPerUser: 2,
    needs: [
      { id: "h1", title: "Pumpkin Carving Lead", quantity: 1, unit: "person" },
      { id: "h2", title: "Face Painting Station", quantity: 2, unit: "people" },
      { id: "h3", title: "Bake Sale Help", quantity: 5, unit: "people" }
    ]
  }
];

export const seedMockData = async (userId, userName) => {
  console.log("Seeding mock data...");
  const eventCollection = collection(db, 'events');
  const MOCK_TEACHER_ID = "mock-teacher-id-123";
  const MOCK_TEACHER_NAME = "Mrs. Gable (1st Grade)";
  
  let count = 0;
  for (const event of MOCK_EVENTS) {
    const isMockTeacher = count % 2 === 1;
    
    try {
      const docRef = await addDoc(eventCollection, {
        ...event,
        createdBy: isMockTeacher ? MOCK_TEACHER_ID : userId,
        creatorName: isMockTeacher ? MOCK_TEACHER_NAME : userName,
        createdAt: serverTimestamp(),
      });

      // Special case for Spring Book Fair (Instant mode)
      if (event.name === "Spring Book Fair") {
        const signupCol = collection(db, 'events', docRef.id, 'signups');
        const mockSignups = [
          { needId: "m1", userName: "John Doe", userEmail: "john@example.com", quantity: 1, createdAt: serverTimestamp() },
          { needId: "m1", userName: "Jane Smith", userEmail: "jane@example.com", quantity: 2, createdAt: serverTimestamp() },
          { needId: "m2", userName: "Bob Wilson", userEmail: "bob@example.com", quantity: 3, createdAt: serverTimestamp() },
          { needId: "m3", userName: "Alice Brown", userEmail: "alice@example.com", quantity: 24, createdAt: serverTimestamp() },
        ];
        for (const signup of mockSignups) { await addDoc(signupCol, signup); }
      }

      // Special case for Harvest Festival (Fair mode requests)
      if (event.name === "Fall Harvest Festival") {
        const reqCol = collection(db, 'events', docRef.id, 'requests');
        const mockRequests = [
          { userId: "v1", userName: "Sarah Jenkins", userEmail: "sarah@example.com", wishlist: ["h1", "h2"], maxWanted: 1, timestamp: serverTimestamp() },
          { userId: "v2", userName: "Mike Ross", userEmail: "mike@example.com", wishlist: ["h1", "h3"], maxWanted: 1, timestamp: serverTimestamp() },
          { userId: "v3", userName: "Emily Blunt", userEmail: "emily@example.com", wishlist: ["h2"], maxWanted: 1, timestamp: serverTimestamp() },
          { userId: "v4", userName: "David Miller", userEmail: "david@example.com", wishlist: ["h1", "h3", "h2"], maxWanted: 2, timestamp: serverTimestamp() },
        ];
        // Note: For the demo to work perfectly, these requests should be readable by the creator.
        for (const req of mockRequests) { await addDoc(reqCol, req); }
      }

      console.log(`Added: ${event.name}`);
    } catch (e) {
      console.error("Error adding event: ", e);
    }
    count++;
  }
  return true;
};
