'use client';

import styles from '../styles/register.module.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '../../public/utils/firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true); 
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const user = await signUp(email, password, name);
      console.log('Usuário registrado com sucesso:', user);

      router.push('/home');
    } catch (error) {
      setError('Erro ao registrar o usuário: ' + error.message);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordMatch(value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(value === password);
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupBox}>
        <div className={styles.logoContainer}>
          <div className={styles.userIcon}></div>
        </div>
        <h1 className={styles.title}>Signup</h1>
        <p className={styles.subtitle}>Register</p>

        <form onSubmit={handleRegister}>
          <input
            type='text'
            placeholder='Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
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
            onChange={handlePasswordChange}
            className={styles.input}
            required
          />
          <input
            type='password'
            placeholder='Confirm Password'
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.signupButton}>Signup</button>
        </form>
        <p className={styles.loginText}>
          Do you have an account? <a href="/" className={styles.signupButton}>Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
