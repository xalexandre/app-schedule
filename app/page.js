// app/page.js
'use client'

import styles from './styles/login.module.css';
import { useState } from 'react';
import { signIn } from '../public/utils/firebase'; 
import { useAuth } from '../contexts/AuthContext'; 
import { useRouter } from 'next/navigation'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, loading } = useAuth(); 
  const router = useRouter(); 

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      router.push('/home'); 
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError('Erro ao fazer login. Verifique suas credenciais.');
      router.push('/home');

    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Verificando autenticação...</div>;
  }

  if (user) {
    return null; 
    
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <div className={styles.lockIcon}></div>
        </div>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.subtitle}>Authentication</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.loginButton}>Login</button>
        </form>
        <p className={styles.signupText}>
          Don't have an account? <a href='/register' className={styles.loginButton}>Signup</a>
        </p>
      </div>
    </div>
  );
}
