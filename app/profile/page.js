'use client';
import styles from '../styles/profile.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';

const Profile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    email: 'informação não consta',
    name: 'informação não consta',
    uid: 'informação não consta',
  });
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      const { displayName, email, uid } = user;
      setUserData({
        name: displayName || 'informação não consta',
        email: email || 'informação não consta',
        uid: uid || 'informação não consta',
      });
    }
  }, [user, router]);

  return (

    <PrivateRoute>  
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.logoContainer}>
            <div className={styles.lockIcon}></div>
          </div>
          <h1 className={styles.title}>Profile</h1>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>E-mail:</strong> {userData.email}</p>
            <p><strong>User ID:</strong> {userData.uid}</p>
          
        </div>
      </div>  
    </PrivateRoute>  
  );
};

export default Profile;