// RealTimeValue.js
import { useEffect, useState } from 'react';
import { db } from './firebase.ts'; // Upewnij się, że ścieżka jest poprawna
import { ref, onValue } from 'firebase/database';

const RealTimeValue: React.FC = () => {
  const [value, setValue] = useState(null);

  useEffect(() => {
    const valueRef = ref(db, '/lobby');

    // Nasłuchiwanie zmian w czasie rzeczywistym
    const unsubscribe = onValue(valueRef, (snapshot) => {
      const data = snapshot.val();
      setValue(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
    {value !== null ? (
      <pre style={{ textAlign: 'left' }}>{JSON.stringify(value, null, '\t')}</pre>
    ) : (
      'Ładowanie...'
    )}
    </>
  );
};

export default RealTimeValue;
